import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { WhatsAppLimitManager, WHATSAPP_LIMITS } from '@/lib/whatsapp-limits'

// Admin endpoint to view and manage WhatsApp bot limits
export async function GET(request: Request) {
  try {
    // Simple admin auth check - in production, use proper admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const period = url.searchParams.get('period') || '7'

    if (userId) {
      // Get specific user's limits and usage
      const limitsInfo = await WhatsAppLimitManager.getUserLimitsInfo(userId)
      
      if (!limitsInfo) {
        return NextResponse.json(
          { error: 'User not found or no subscription' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          ...limitsInfo
        }
      })
    } else {
      // Get overall statistics
      const days = parseInt(period)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)

      // Get aggregated usage stats
      const usageStats = await prisma.whatsAppUsage.aggregate({
        where: {
          date: { gte: startDate }
        },
        _sum: {
          messagesCount: true,
          documentsCount: true
        },
        _avg: {
          messagesCount: true,
          documentsCount: true
        }
      })

      // Get top users by usage
      const topUsers = await prisma.whatsAppUsage.groupBy({
        by: ['userId'],
        where: {
          date: { gte: startDate }
        },
        _sum: {
          messagesCount: true,
          documentsCount: true
        },
        orderBy: {
          _sum: {
            messagesCount: 'desc'
          }
        },
        take: 10
      })

      // Get users near limits
      const usersNearLimits = []
      const activeSubscriptions = await prisma.subscription.findMany({
        where: {
          status: { in: ['ACTIVE', 'TRIAL'] }
        },
        include: {
          user: true
        }
      })

      for (const subscription of activeSubscriptions) {
        const limitsInfo = await WhatsAppLimitManager.getUserLimitsInfo(subscription.userId)
        if (limitsInfo) {
          const dailyPercentage = (limitsInfo.usage.dailyMessages / limitsInfo.limits.dailyMessages) * 100
          const monthlyPercentage = (limitsInfo.usage.monthlyMessages / limitsInfo.limits.monthlyMessages) * 100
          
          if (dailyPercentage > 80 || monthlyPercentage > 80) {
            usersNearLimits.push({
              userId: subscription.userId,
              userPhone: subscription.user.whatsappPhone,
              plan: subscription.plan,
              status: subscription.status,
              dailyPercentage: Math.round(dailyPercentage),
              monthlyPercentage: Math.round(monthlyPercentage),
              usage: limitsInfo.usage,
              limits: limitsInfo.limits
            })
          }
        }
      }

      return NextResponse.json({
        success: true,
        period: `${days} days`,
        overview: {
          totalMessages: usageStats._sum.messagesCount || 0,
          totalDocuments: usageStats._sum.documentsCount || 0,
          avgMessagesPerDay: Math.round((usageStats._avg.messagesCount || 0) * 100) / 100,
          avgDocumentsPerDay: Math.round((usageStats._avg.documentsCount || 0) * 100) / 100
        },
        topUsers,
        usersNearLimits,
        limitConfiguration: WHATSAPP_LIMITS
      })
    }
  } catch (error) {
    console.error('Admin WhatsApp limits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Reset user limits (emergency function)
export async function POST(request: Request) {
  try {
    // Admin auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId, resetType } = await request.json()

    if (!userId || !resetType) {
      return NextResponse.json(
        { error: 'userId and resetType required' },
        { status: 400 }
      )
    }

    if (resetType === 'daily') {
      // Reset today's usage
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.whatsAppUsage.update({
        where: {
          userId_date: {
            userId,
            date: today
          }
        },
        data: {
          messagesCount: 0,
          documentsCount: 0
        }
      })
    } else if (resetType === 'rate_limit') {
      // Reset rate limiting
      await prisma.whatsAppRateLimit.deleteMany({
        where: { userId }
      })
    } else if (resetType === 'all') {
      // Reset all usage data for user
      await prisma.whatsAppUsage.deleteMany({
        where: { userId }
      })
      await prisma.whatsAppRateLimit.deleteMany({
        where: { userId }
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid resetType (daily, rate_limit, or all)' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${resetType} limits reset for user ${userId}`
    })
  } catch (error) {
    console.error('Admin reset limits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}