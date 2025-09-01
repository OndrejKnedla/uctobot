import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    
    if (authHeader && authHeader.startsWith('Basic ')) {
      const credentials = authHeader.slice(6)
      const [username, password] = Buffer.from(credentials, 'base64').toString().split(':')
      
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
      
      if (!ADMIN_PASSWORD || username !== 'admin' || password !== ADMIN_PASSWORD) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    } else {
      // No auth header provided
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
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