import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/prisma'
import jwt from 'jsonwebtoken'

// Verify JWT token
async function verifyToken(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return null
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded.userId
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const userId = await verifyToken(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, isFoundingMember } = await request.json()

    if (!plan || !['MONTHLY', 'YEARLY'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Get user
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })


    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate price
    let amount = plan === 'MONTHLY' ? 299 : 2988 // 299 Kč/month or 2988 Kč/year
    let displayAmount = plan === 'MONTHLY' ? 299 : 249 // Display monthly equivalent
    
    // Check founding member eligibility
    if (isFoundingMember && !user.subscription?.isFoundingMember) {
      const foundingMembersCount = await prisma.subscription.count({
        where: { isFoundingMember: true }
      })

      if (foundingMembersCount >= 50) {
        return NextResponse.json({ 
          error: 'Founding member slots are full' 
        }, { status: 400 })
      }
    }

    // Create Stripe customer if doesn't exist
    let customerId = user.subscription?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name,
        phone: user.whatsappPhone,
        metadata: {
          userId: user.id,
          whatsappPhone: user.whatsappPhone
        }
      })
      customerId = customer.id
    }

    // Create real Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'czk',
      customer: customerId,
      metadata: {
        userId: user.id,
        plan: plan,
        isFoundingMember: isFoundingMember ? 'true' : 'false'
      },
      description: `ÚčtoBot ${plan === 'MONTHLY' ? 'měsíční' : 'roční'} předplatné`,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: displayAmount,
      plan: plan,
      isFoundingMember: isFoundingMember
    })

  } catch (error) {
    console.error('Payment intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}