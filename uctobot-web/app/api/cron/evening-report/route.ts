import { NextRequest, NextResponse } from 'next/server'
import DailyBriefingService from '@/lib/services/dailyBriefing'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🌙 Starting evening report cron job...')
    
    // Get all users who want evening reports
    const users = await prisma.user.findMany({
      where: {
        whatsappVerified: true,
        isProfileComplete: true,
        eveningReportEnabled: true,
        whatsappPhone: { not: null }
      }
    })

    const results = []
    
    for (const user of users) {
      try {
        await DailyBriefingService.sendEveningReport(user.id)
        results.push({ userId: user.id, success: true })
      } catch (error) {
        console.error(`Failed to send evening report to user ${user.id}:`, error)
        results.push({ userId: user.id, success: false, error })
      }
    }
    
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    console.log(`🌙 Evening report completed: ${successful} sent, ${failed} failed`)
    
    return NextResponse.json({
      success: true,
      message: `Evening reports sent to ${successful} users`,
      successful,
      failed,
      results
    })
    
  } catch (error) {
    console.error('❌ Evening report cron job failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send evening reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  try {
    if (userId) {
      await DailyBriefingService.sendEveningReport(userId)
      return NextResponse.json({ success: true, message: 'Evening report sent' })
    } else {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}