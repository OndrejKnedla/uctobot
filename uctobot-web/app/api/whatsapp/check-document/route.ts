import { NextResponse } from 'next/server'
import { WhatsAppLimitManager } from '@/lib/whatsapp-limits'
import jwt from 'jsonwebtoken'

// Check if user can process a document
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
    
    // Check if user can process document
    const documentCheck = await WhatsAppLimitManager.canProcessDocument(userId)
    
    if (!documentCheck.allowed) {
      return NextResponse.json({
        success: false,
        allowed: false,
        reason: documentCheck.reason
      }, { status: 429 }) // Too Many Requests
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      remaining: documentCheck.remaining
    })
  } catch (error) {
    console.error('WhatsApp document check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}