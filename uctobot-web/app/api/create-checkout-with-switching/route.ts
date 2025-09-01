import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('dummy')) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const { plan, isFoundingMember, customerName, customerEmail } = await request.json()

    if (!plan || !['MONTHLY', 'YEARLY'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!customerName || !customerEmail) {
      return NextResponse.json({ error: 'Customer information required' }, { status: 400 })
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

    // Create Stripe Checkout Session with plan switching
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      
      // Both price options for plan switching
      line_items: [
        {
          price: process.env.STRIPE_MONTHLY_PRICE_ID!,
          quantity: 1,
        }
      ],
      
      // Enable plan switching by providing alternative prices
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: user?.id || 'unknown',
          plan: plan,
          isFoundingMember: isFoundingMember ? 'true' : 'false'
        }
      },

      // Customer information
      customer_email: customerEmail,
      billing_address_collection: 'auto',
      
      // Enable features for better UX
      allow_promotion_codes: true,
      tax_id_collection: {
        enabled: true
      },
      
      // Custom branding and text
      custom_text: {
        submit: {
          message: isFoundingMember 
            ? '🚀 Launch Week Special - Zakladatelská cena navždy!' 
            : 'Začněte s 7denním zkušebním obdobím zdarma'
        }
      },

      // URLs
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/platba-uspesna?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/platba?cancelled=true`,
      
      // Metadata
      metadata: {
        userId: user?.id || 'unknown',
        plan: plan,
        isFoundingMember: isFoundingMember ? 'true' : 'false',
        customerName: customerName,
      },

      // Invoice settings for Czech customers
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `ÚčtoBot Premium - ${plan === 'MONTHLY' ? 'Měsíční' : 'Roční'} předplatné`,
          metadata: {
            customer_name: customerName,
            plan_type: plan
          }
        }
      }
    })

    // If user selected yearly, create a separate session with yearly as default
    if (plan === 'YEARLY') {
      const yearlySession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        
        line_items: [
          {
            price: process.env.STRIPE_YEARLY_PRICE_ID!,
            quantity: 1,
          }
        ],
        
        subscription_data: {
          trial_period_days: 7,
          metadata: {
            userId: user?.id || 'unknown',
            plan: 'YEARLY',
            isFoundingMember: isFoundingMember ? 'true' : 'false'
          }
        },

        customer_email: customerEmail,
        billing_address_collection: 'auto',
        allow_promotion_codes: true,
        tax_id_collection: { enabled: true },
        
        custom_text: {
          submit: {
            message: isFoundingMember 
              ? '🚀 Launch Week Special - Zakladatelská cena navždy! + 2 měsíce zdarma' 
              : 'Ušetřete 398 Kč ročně + 7 dní zdarma'
          }
        },

        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/platba-uspesna?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/platba?cancelled=true`,
        
        metadata: {
          userId: user?.id || 'unknown',
          plan: 'YEARLY',
          isFoundingMember: isFoundingMember ? 'true' : 'false',
          customerName: customerName,
        },

        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: 'ÚčtoBot Premium - Roční předplatné (2 měsíce zdarma)',
            metadata: {
              customer_name: customerName,
              plan_type: 'YEARLY'
            }
          }
        }
      })
      
      return NextResponse.json({
        url: yearlySession.url,
        sessionId: yearlySession.id
      })
    }

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