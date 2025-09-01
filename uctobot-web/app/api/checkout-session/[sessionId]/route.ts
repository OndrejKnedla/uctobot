import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('dummy')) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Generate activation code
    const activationCode = `UCTOBOT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now

    // Get metadata
    const userId = session.metadata?.userId
    const plan = session.metadata?.plan
    const isFoundingMember = session.metadata?.isFoundingMember === 'true'
    const customerEmail = session.customer_details?.email || session.customer_email

    // Store subscription and activation code in database
    if (userId && userId !== 'unknown' && session.customer && session.subscription) {
      try {
        // Update user with Stripe customer ID
        await prisma.user.update({
          where: { id: userId },
          data: { 
            email: customerEmail || undefined 
          }
        })

        // Create or update subscription
        await prisma.subscription.upsert({
          where: { userId: userId },
          update: {
            stripeSubscriptionId: session.subscription as string,
            plan: plan as 'MONTHLY' | 'YEARLY',
            status: 'ACTIVE',
            price: plan === 'MONTHLY' ? 299 : 2988,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + (plan === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000),
            isFoundingMember: isFoundingMember,
            lockedPrice: plan === 'MONTHLY' ? 299 : 2988,
            stripeCustomerId: session.customer as string
          },
          create: {
            userId: userId,
            stripeSubscriptionId: session.subscription as string,
            plan: plan as 'MONTHLY' | 'YEARLY',
            status: 'ACTIVE',
            price: plan === 'MONTHLY' ? 299 : 2988,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + (plan === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000),
            isFoundingMember: isFoundingMember,
            lockedPrice: plan === 'MONTHLY' ? 299 : 2988,
            stripeCustomerId: session.customer as string
          }
        })

        // Store activation code
        await prisma.activationCode.create({
          data: {
            code: activationCode,
            userId: userId,
            expiresAt: expiresAt,
            used: false
          }
        })
      } catch (dbError) {
        console.error('Database operation error:', dbError)
        // Continue anyway, as the payment was successful
      }
    }

    return NextResponse.json({
      activationCode,
      whatsappNumber: '+420608123456', // Your WhatsApp business number
      userEmail: customerEmail || 'customer@example.com',
      expiresAt: expiresAt.toISOString(),
      sessionInfo: {
        plan: session.metadata?.plan,
        isFoundingMember: session.metadata?.isFoundingMember === 'true',
        customerName: session.metadata?.customerName,
        amount: session.amount_total ? session.amount_total / 100 : 0
      }
    })

  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve session data' },
      { status: 500 }
    )
  }
}