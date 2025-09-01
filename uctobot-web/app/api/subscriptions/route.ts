import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import jwt from 'jsonwebtoken'

// Middleware to verify JWT token
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

// GET user subscription
export async function GET(request: Request) {
  const userId = await verifyToken(request)
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Check if trial expired
    if (subscription.status === 'TRIAL' && subscription.trialEndsAt) {
      if (subscription.trialEndsAt < new Date()) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' }
        })
        subscription.status = 'EXPIRED'
      }
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

// POST create/update subscription
export async function POST(request: Request) {
  const userId = await verifyToken(request)
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { plan, isFoundingMember } = await request.json()

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    // Determine price based on plan and founding member status
    let price = plan === 'YEARLY' ? 2988 : 299
    let monthlyPrice = plan === 'YEARLY' ? 249 : 299

    // Check if founding member slots are available
    if (isFoundingMember && !existingSubscription?.isFoundingMember) {
      const foundingMembersCount = await prisma.subscription.count({
        where: { isFoundingMember: true }
      })

      if (foundingMembersCount >= 50) {
        return NextResponse.json(
          { error: 'Founding member slots are full' },
          { status: 400 }
        )
      }
    }

    const subscriptionData = {
      plan,
      status: 'ACTIVE' as const,
      price: plan === 'YEARLY' ? price : monthlyPrice,
      currentPeriodStart: new Date(),
      currentPeriodEnd: plan === 'YEARLY' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isFoundingMember: isFoundingMember || existingSubscription?.isFoundingMember || false,
      lockedPrice: isFoundingMember ? monthlyPrice : existingSubscription?.lockedPrice
    }

    let subscription

    if (existingSubscription) {
      subscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: subscriptionData
      })
    } else {
      subscription = await prisma.subscription.create({
        data: {
          ...subscriptionData,
          userId
        }
      })
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: price,
        currency: 'CZK',
        status: 'PENDING'
      }
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

// DELETE cancel subscription
export async function DELETE(request: Request) {
  const userId = await verifyToken(request)
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const subscription = await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}