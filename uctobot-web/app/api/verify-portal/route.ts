import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verificationStore } from '@/lib/verification-store'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Chybí ověřovací token' },
        { status: 400 }
      )
    }

    // Check if token exists and is valid
    const tokenData = verificationStore.get(token)
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Neplatný nebo expirovaný ověřovací token' },
        { status: 400 }
      )
    }

    // Find customer by email
    const customers = await stripe.customers.list({
      email: tokenData.email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'Zákazník nebyl nalezen' },
        { status: 404 }
      )
    }

    const customer = customers.data[0]

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dokladbot.cz'}`,
    })

    // Delete the token after successful use
    verificationStore.delete(token)

    // Redirect to customer portal
    return NextResponse.redirect(portalSession.url)
    
  } catch (error) {
    console.error('Portal verification error:', error)
    return NextResponse.json(
      { error: 'Chyba při ověřování přístupu' },
      { status: 500 }
    )
  }
}

// Also handle POST for programmatic access
export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Chybí ověřovací token' },
        { status: 400 }
      )
    }

    // Same logic as GET but return JSON
    const tokenData = verificationStore.get(token)
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Neplatný nebo expirovaný ověřovací token' },
        { status: 400 }
      )
    }

    const customers = await stripe.customers.list({
      email: tokenData.email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'Zákazník nebyl nalezen' },
        { status: 404 }
      )
    }

    const customer = customers.data[0]
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dokladbot.cz'}`,
    })

    verificationStore.delete(token)

    return NextResponse.json({ 
      url: portalSession.url 
    })
    
  } catch (error) {
    console.error('Portal verification error:', error)
    return NextResponse.json(
      { error: 'Chyba při ověřování přístupu' },
      { status: 500 }
    )
  }
}