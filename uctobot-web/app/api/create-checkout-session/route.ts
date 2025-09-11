import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    const { plan, tier, isFoundingMember, customerName, customerEmail } = await request.json()

    if (!plan || !['MONTHLY', 'YEARLY'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan frequency' }, { status: 400 })
    }

    if (!tier || !['starter', 'professional', 'business'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 })
    }

    if (!customerName || !customerEmail) {
      return NextResponse.json({ error: 'Customer information required' }, { status: 400 })
    }

    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('dummy')) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    // Define base prices
    const basePrices = {
      starter: { monthly: 199, yearly: 1990 },
      professional: { monthly: 349, yearly: 3490 },
      business: { monthly: 599, yearly: 5990 }
    }

    // Calculate prices based on tier and frequency
    const getPrices = (tierName: string, frequency: string) => {
      const basePrice = basePrices[tierName as keyof typeof basePrices][frequency === 'MONTHLY' ? 'monthly' : 'yearly']
      // Add 21% VAT
      const priceWithVAT = basePrice * 1.21
      return Math.round(priceWithVAT * 100) / 100 // Round to 2 decimal places
    }

    const amountWithExactVAT = getPrices(tier, plan)

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
      locale: 'cs',
      line_items: [
        {
          price_data: {
            currency: 'czk',
            product_data: {
              name: `ÚčtoBot ${tier === 'professional' ? 'Profesionál' : tier === 'starter' ? 'Starter' : 'Business'} - ${plan === 'MONTHLY' ? 'Měsíční' : 'Roční'} předplatné`,
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
      metadata: {
        userId: user?.id || 'unknown',
        plan: plan,
        tier: tier,
        isFoundingMember: isFoundingMember ? 'true' : 'false',
        customerName: customerName,
        customerEmail: customerEmail
      },
      subscription_data: {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'create_invoice'
          }
        },
        metadata: {
          userId: user?.id || 'unknown',
          plan: plan,
          tier: tier,
          isFoundingMember: isFoundingMember ? 'true' : 'false',
          customerName: customerName
        }
      },
      
      // Custom text based on selected plan
      custom_text: {
        submit: {
          message: plan === 'MONTHLY' 
            ? '💡 Tip: Roční plán = 2 měsíce zdarma! Prvních 7 dní zkušebně zdarma.'
            : '💰 Skvělá volba! 2 měsíce zdarma + prvních 7 dní zkušebně'
        }
      },
      
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dokladbot.cz'}/platba-uspesna?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dokladbot.cz'}/platba?cancelled=true&plan=${plan}`,
      customer_email: customerEmail,
      billing_address_collection: 'auto',
      tax_id_collection: {
        enabled: true
      },
      metadata: {
        userId: user?.id || 'unknown',
        plan: plan,
        tier: tier,
        isFoundingMember: isFoundingMember ? 'true' : 'false',
        customerName: customerName,
        basePrice: basePrices[tier as keyof typeof basePrices][plan === 'MONTHLY' ? 'monthly' : 'yearly'].toString(),
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