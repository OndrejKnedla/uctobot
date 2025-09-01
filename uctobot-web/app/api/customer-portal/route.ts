import { NextResponse } from 'next/server'
import Stripe from 'stripe'

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

    // Find customer by email
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

    const customer = customers.data[0]

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dokladbot.cz'}`,
    })

    return NextResponse.json({ 
      url: portalSession.url 
    })
    
  } catch (error) {
    console.error('Customer portal error:', error)
    return NextResponse.json(
      { error: 'Chyba při vytváření portálu' },
      { status: 500 }
    )
  }
}