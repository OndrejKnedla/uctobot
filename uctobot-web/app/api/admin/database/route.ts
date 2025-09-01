import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // Fetch all data from database
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    const codes = await prisma.activationCode.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    const subscriptions = await prisma.subscription.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    // Calculate stats
    const stats = {
      users: await prisma.user.count(),
      codes: await prisma.activationCode.count(),
      subscriptions: await prisma.subscription.count(),
      activeSubscriptions: await prisma.subscription.count({
        where: { status: 'ACTIVE' }
      })
    }
    
    return NextResponse.json({
      stats,
      users,
      codes,
      subscriptions
    })
    
  } catch (error) {
    console.error('Database fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch database' },
      { status: 500 }
    )
  }
}