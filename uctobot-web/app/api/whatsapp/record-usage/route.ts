import { NextResponse } from 'next/server'
import { WhatsAppLimitManager } from '@/lib/whatsapp-limits'
import jwt from 'jsonwebtoken'

// Record WhatsApp bot usage (message or document)
export async function POST(request: Request) {
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
    const { type } = await request.json()

    if (!type || !['message', 'document'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid usage type required (message or document)' },
        { status: 400 }
      )
    }

    // Record usage
    if (type === 'message') {
      await WhatsAppLimitManager.recordMessageUsage(userId)
    } else if (type === 'document') {
      await WhatsAppLimitManager.recordDocumentUsage(userId)
    }

    return NextResponse.json({
      success: true,
      message: `${type} usage recorded successfully`
    })
  } catch (error) {
    console.error('WhatsApp usage recording error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}