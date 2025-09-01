import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    const { plan, isFoundingMember, customerName, customerEmail } = await request.json()

    if (!plan || !['MONTHLY', 'YEARLY'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!customerName || !customerEmail) {
      return NextResponse.json({ error: 'Customer information required' }, { status: 400 })
    }

    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('dummy')) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    // Calculate exact price with VAT (21%)
    const amountWithExactVAT = plan === 'MONTHLY' ? 240.79 : 2407.90 // Exact VAT calculation
    const displayAmount = plan === 'MONTHLY' ? 240.79 : 200.66 // Display monthly equivalent

    // Check founding member eligibility
    let foundingMembersCount = 0
    if (isFoundingMember) {
      try {
        foundingMembersCount = await prisma.subscription.count({
          where: { isFoundingMember: true }
        })
        
        if (foundingMembersCount >= 50) {
          return NextResponse.json({ 
            error: 'Founding member slots are full' 
          }, { status: 400 })
        }
      } catch (error) {
        console.warn('Could not check founding members count, proceeding:', error)
      }
    }

    // Create or retrieve user
    let user
    try {
      user = await prisma.user.findFirst({
        where: { email: customerEmail }
      })

      if (!user) {
        const randomPhone = `+420${Math.floor(100000000 + Math.random() * 900000000)}`
        user = await prisma.user.create({
          data: {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: customerName,
            email: customerEmail,
            whatsappPhone: randomPhone,
          }
        })
      }
    } catch (error) {
      console.warn('Database operations failed, creating session without user tracking:', error)
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'czk',
            product_data: {
              name: `DokladBot ${plan === 'MONTHLY' ? 'Měsíční' : 'Roční'} předplatné`,
              description: 'Profesionální účetnictví přes WhatsApp',
            },
            unit_amount: Math.round(amountWithExactVAT * 100), // Convert to cents
            recurring: {
              interval: plan === 'MONTHLY' ? 'month' : 'year',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: user?.id || 'unknown',
          plan: plan,
          isFoundingMember: isFoundingMember ? 'true' : 'false',
          customerName: customerName
        }
      },
      
      // Custom text based on selected plan
      custom_text: {
        submit: {
          message: plan === 'MONTHLY' 
            ? '💡 Tip: Roční plán ušetří 2 měsíce (1990 Kč + DPH/rok)'
            : '💰 Skvělá volba! Ušetříte 2 měsíce + 7 dní zdarma'
        }
      },
      
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/platba-uspesna?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/platba?cancelled=true&plan=${plan}`,
      customer_email: customerEmail,
      billing_address_collection: 'auto',
      tax_id_collection: {
        enabled: true
      },
      metadata: {
        userId: user?.id || 'unknown',
        plan: plan,
        isFoundingMember: isFoundingMember ? 'true' : 'false',
        customerName: customerName,
        basePrice: plan === 'MONTHLY' ? '199' : '1990',
        vatIncluded: 'true'
      },
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    })

  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}