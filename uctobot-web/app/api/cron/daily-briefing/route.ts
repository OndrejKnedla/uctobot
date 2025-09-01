import { NextRequest, NextResponse } from 'next/server'
import DailyBriefingService from '@/lib/services/dailyBriefing'

// This endpoint will be called by a cron service (Vercel Cron, GitHub Actions, etc.)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🌅 Starting daily briefing cron job...')
    
    const results = await DailyBriefingService.sendMorningBriefings()
    
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    console.log(`✅ Daily briefing completed: ${successful} sent, ${failed} failed`)
    
    return NextResponse.json({
      success: true,
      message: `Daily briefings sent to ${successful} users`,
      successful,
      failed,
      results
    })
    
  } catch (error) {
    console.error('❌ Daily briefing cron job failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send daily briefings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle GET request for manual testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  try {
    if (userId) {
      // Send briefing to specific user
      const result = await DailyBriefingService.sendMorningBriefingToUser(userId)
      return NextResponse.json({ success: true, result })
    } else {
      // Send to all users
      const results = await DailyBriefingService.sendMorningBriefings()
      return NextResponse.json({ success: true, results })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}