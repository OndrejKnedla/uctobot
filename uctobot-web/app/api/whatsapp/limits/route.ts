import { NextResponse } from 'next/server'
import { WhatsAppLimitManager } from '@/lib/whatsapp-limits'
import { prisma } from '@/lib/db/prisma'
import jwt from 'jsonwebtoken'

// Get user's WhatsApp bot limits and usage
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
    
    const limitsInfo = await WhatsAppLimitManager.getUserLimitsInfo(userId)
    
    if (!limitsInfo) {
      return NextResponse.json(
        { error: 'User not found or no active subscription' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: limitsInfo
    })
  } catch (error) {
    console.error('WhatsApp limits check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}