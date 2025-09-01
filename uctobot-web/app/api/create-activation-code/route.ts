import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Generate activation code
    const activationCode = `UCTOBOT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now

    // Get customer info
    const customerEmail = session.customer_details?.email || session.customer_email
    const customerName = session.metadata?.customerName || 'Zákazník'
    const plan = session.metadata?.plan || 'YEARLY'
    const isFoundingMember = session.metadata?.isFoundingMember === 'true'

    // Create or find user
    let user = await prisma.user.findFirst({
      where: { email: customerEmail || '' }
    })

    if (!user && customerEmail) {
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

    if (user) {
      // Delete any existing activation code for this user
      await prisma.activationCode.deleteMany({
        where: { userId: user.id }
      })

      // Create new activation code
      await prisma.activationCode.create({
        data: {
          code: activationCode,
          userId: user.id,
          expiresAt: expiresAt,
          used: false
        }
      })

      // Create or update subscription if payment was successful
      if (session.payment_status === 'paid' && session.customer && session.subscription) {
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            stripeSubscriptionId: subscriptionId,
            plan: plan as 'MONTHLY' | 'YEARLY',
            status: 'ACTIVE',
            price: plan === 'MONTHLY' ? 299 : 2988,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + (plan === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000),
            isFoundingMember: isFoundingMember,
            lockedPrice: plan === 'MONTHLY' ? 299 : 2988,
          },
          create: {
            userId: user.id,
            stripeSubscriptionId: subscriptionId,
            plan: plan as 'MONTHLY' | 'YEARLY',
            status: 'ACTIVE',
            price: plan === 'MONTHLY' ? 299 : 2988,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + (plan === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000),
            isFoundingMember: isFoundingMember,
            lockedPrice: plan === 'MONTHLY' ? 299 : 2988,
          }
        })
      }
    }

    return NextResponse.json({
      activationCode,
      whatsappNumber: '+420608123456', // Your WhatsApp business number
      userEmail: customerEmail || 'customer@example.com',
      expiresAt: expiresAt.toISOString(),
      sessionInfo: {
        plan: plan,
        isFoundingMember: isFoundingMember,
        customerName: customerName,
        paymentStatus: session.payment_status,
        amount: session.amount_total ? session.amount_total / 100 : 0
      }
    })

  } catch (error) {
    console.error('Activation code creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create activation code' },
      { status: 500 }
    )
  }
}