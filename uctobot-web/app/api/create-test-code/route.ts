import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    // Generate a test activation code
    const activationCode = `DOKLADBOT-TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now

    // Create a test user if doesn't exist
    const testEmail = 'test@dokladbot.cz'
    let user = await prisma.user.findFirst({
      where: { email: testEmail }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: `user_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: 'Test User',
          email: testEmail,
          whatsappPhone: '+420777123456', // Test phone number
        }
      })
    }

    // Delete any existing activation codes for this user
    await prisma.activationCode.deleteMany({
      where: { userId: user.id }
    })

    // Create new test activation code
    await prisma.activationCode.create({
      data: {
        code: activationCode,
        userId: user.id,
        expiresAt: expiresAt,
        used: false
      }
    })

    // Create a test subscription
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: 'MONTHLY',
        status: 'ACTIVE',
        price: 199,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isFoundingMember: false,
        lockedPrice: 199,
      },
      create: {
        userId: user.id,
        plan: 'MONTHLY',
        status: 'ACTIVE',
        price: 199,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isFoundingMember: false,
        lockedPrice: 199,
      }
    })

    return NextResponse.json({
      success: true,
      activationCode,
      testUser: {
        email: testEmail,
        phone: user.whatsappPhone
      },
      expiresAt: expiresAt.toISOString(),
      message: `Test activation code created: ${activationCode}`
    })

  } catch (error) {
    console.error('Error creating test code:', error)
    return NextResponse.json({ 
      error: 'Failed to create test code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}