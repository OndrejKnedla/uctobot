import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      take: 3,
      include: {
        subscription: true,
        activationCodes: true
      }
    })

    const activationCodes = await prisma.activationCode.findMany({
      orderBy: { id: 'desc' },
      take: 5,
      include: { user: true }
    })

    return NextResponse.json({
      users,
      activationCodes,
      totalUsers: await prisma.user.count(),
      totalCodes: await prisma.activationCode.count()
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}