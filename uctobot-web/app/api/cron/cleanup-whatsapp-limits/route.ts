import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Cron job to cleanup old WhatsApp rate limiting data
export async function POST(request: Request) {
  try {
    // Verify cron job authentication (Vercel or similar)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Clean up old rate limit records (older than 2 hours)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    
    const deletedRateLimits = await prisma.whatsAppRateLimit.deleteMany({
      where: {
        windowStart: {
          lt: twoHoursAgo
        }
      }
    })

    // Clean up old usage records (older than 1 year, but keep monthly aggregates)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    oneYearAgo.setHours(0, 0, 0, 0)

    const deletedUsageRecords = await prisma.whatsAppUsage.deleteMany({
      where: {
        date: {
          lt: oneYearAgo
        }
      }
    })

    console.log(`WhatsApp limits cleanup completed:`)
    console.log(`- Deleted ${deletedRateLimits.count} old rate limit records`)
    console.log(`- Deleted ${deletedUsageRecords.count} old usage records`)

    return NextResponse.json({
      success: true,
      cleanup: {
        rateLimitsDeleted: deletedRateLimits.count,
        usageRecordsDeleted: deletedUsageRecords.count
      }
    })
  } catch (error) {
    console.error('WhatsApp limits cleanup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}