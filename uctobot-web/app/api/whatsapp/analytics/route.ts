import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import jwt from 'jsonwebtoken'

// Get WhatsApp bot usage analytics
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { userId } = decoded
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '30' // default 30 days

    const days = parseInt(period)
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Invalid period (1-365 days)' },
        { status: 400 }
      )
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get usage data for the period
    const usageData = await prisma.whatsAppUsage.findMany({
      where: {
        userId,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Calculate totals
    const totals = usageData.reduce(
      (acc, day) => ({
        totalMessages: acc.totalMessages + day.messagesCount,
        totalDocuments: acc.totalDocuments + day.documentsCount
      }),
      { totalMessages: 0, totalDocuments: 0 }
    )

    // Get daily averages
    const averages = {
      messagesPerDay: Math.round((totals.totalMessages / days) * 100) / 100,
      documentsPerDay: Math.round((totals.totalDocuments / days) * 100) / 100
    }

    // Get user's subscription info for context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    // Prepare chart data (daily usage)
    const chartData = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      const dayUsage = usageData.find(
        u => u.date.toDateString() === date.toDateString()
      )
      
      chartData.push({
        date: date.toISOString().split('T')[0],
        messages: dayUsage?.messagesCount || 0,
        documents: dayUsage?.documentsCount || 0
      })
    }

    // Get current month usage for percentage calculation
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyUsage = await prisma.whatsAppUsage.aggregate({
      where: {
        userId,
        date: {
          gte: currentMonth
        }
      },
      _sum: {
        messagesCount: true,
        documentsCount: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        period: `${days} days`,
        totals,
        averages,
        chartData,
        currentMonth: {
          messages: monthlyUsage._sum.messagesCount || 0,
          documents: monthlyUsage._sum.documentsCount || 0
        },
        subscription: {
          plan: user?.subscription?.plan || null,
          status: user?.subscription?.status || null
        }
      }
    })
  } catch (error) {
    console.error('WhatsApp analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}