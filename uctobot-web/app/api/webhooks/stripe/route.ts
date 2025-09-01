import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  // Check if Stripe is properly configured
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('dummy')) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan
        const isFoundingMember = session.metadata?.isFoundingMember === 'true'
        const customerName = session.metadata?.customerName

        if (!userId || !plan) {
          console.error('Missing metadata in checkout session')
          break
        }

        // Update or create subscription
        try {
          const subscriptionData = {
            plan: plan as 'MONTHLY' | 'YEARLY',
            status: 'ACTIVE' as const,
            price: plan === 'MONTHLY' ? 299 : 249,
            currentPeriodStart: new Date(),
            currentPeriodEnd: plan === 'YEARLY' 
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isFoundingMember,
            lockedPrice: isFoundingMember ? (plan === 'MONTHLY' ? 299 : 249) : null,
            stripeCustomerId: session.customer as string
          }

          // Update user with Stripe customer info
          await prisma.user.update({
            where: { id: userId },
            data: {
              name: customerName || 'Unknown',
              email: session.customer_email || undefined
            }
          })

          await prisma.subscription.upsert({
            where: { userId },
            create: { ...subscriptionData, userId },
            update: subscriptionData
          })

          // Generate activation code for WhatsApp
          const activationCode = `UCTOBOT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
          
          console.log(`Checkout completed for user ${userId}, plan: ${plan}, activation code: ${activationCode}`)
        } catch (dbError) {
          console.error('Database error during checkout processing:', dbError)
        }
        
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        
        const userId = paymentIntent.metadata?.userId
        const plan = paymentIntent.metadata?.plan
        const isFoundingMember = paymentIntent.metadata?.isFoundingMember === 'true'

        if (!userId || !plan) {
          console.error('Missing metadata in payment intent')
          break
        }

        // Update or create subscription
        const subscriptionData = {
          plan: plan as 'MONTHLY' | 'YEARLY',
          status: 'ACTIVE' as const,
          price: plan === 'MONTHLY' ? 299 : 249,
          currentPeriodStart: new Date(),
          currentPeriodEnd: plan === 'YEARLY' 
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isFoundingMember,
          lockedPrice: isFoundingMember ? (plan === 'MONTHLY' ? 299 : 249) : null,
          stripeCustomerId: paymentIntent.customer as string
        }

        await prisma.subscription.upsert({
          where: { userId },
          create: { ...subscriptionData, userId },
          update: subscriptionData
        })

        // Create payment record and activation code
        const subscription = await prisma.subscription.findUnique({
          where: { userId }
        })

        if (subscription) {
          await prisma.payment.create({
            data: {
              subscriptionId: subscription.id,
              amount: paymentIntent.amount / 100, // Convert from cents
              currency: paymentIntent.currency.toUpperCase(),
              status: 'SUCCEEDED',
              stripePaymentIntentId: paymentIntent.id,
              paidAt: new Date()
            }
          })

          // Generate activation code for WhatsApp
          const activationCode = `UCTOBOT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
          const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

          // Store activation code in database (you might want to create a separate table for this)
          await prisma.user.update({
            where: { id: userId },
            data: {
              // Store activation code in user record for now
              // In production, create a separate ActivationCode table
              name: `${subscription.user?.name || 'User'} (Code: ${activationCode})`
            }
          })
        }

        console.log(`Payment succeeded for user ${userId}, plan: ${plan}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const userId = paymentIntent.metadata?.userId

        if (userId) {
          const subscription = await prisma.subscription.findUnique({
            where: { userId }
          })

          if (subscription) {
            await prisma.payment.create({
              data: {
                subscriptionId: subscription.id,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency.toUpperCase(),
                status: 'FAILED',
                stripePaymentIntentId: paymentIntent.id,
                failedAt: new Date()
              }
            })
          }
        }

        console.log(`Payment failed for user ${userId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}