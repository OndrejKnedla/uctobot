import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import crypto from 'crypto'
import { verificationStore } from '@/lib/verification-store'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email je povinný' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Neplatný formát emailu' },
        { status: 400 }
      )
    }

    // Find customer by email in Stripe
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'Zákazník s tímto emailem nebyl nalezen' },
        { status: 404 }
      )
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = Date.now() + (15 * 60 * 1000) // 15 minutes expiration
    
    // Store token
    verificationStore.set(token, { email, expires })

    // Create verification URL
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dokladbot.cz'}/verify-portal?token=${token}`

    // Send email (this would be implemented with your email service)
    console.log(`Verification email would be sent to ${email} with URL: ${verifyUrl}`)
    
    // For now, just return success (in production, implement actual email sending)
    return NextResponse.json({ 
      success: true,
      message: 'Ověřovací email byl odeslán na vaši adresu',
      // Remove this in production - only for testing
      verifyUrl: verifyUrl
    })
    
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Chyba při odesílání ověřovacího emailu' },
      { status: 500 }
    )
  }
}

// Debug endpoint to check token stats
export async function GET() {
  const stats = verificationStore.getStats()
  return NextResponse.json(stats)
}