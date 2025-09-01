import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test database connection
    const result = await prisma.user.findMany({
      take: 1
    })
    
    console.log('Database test successful:', result)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection working',
      data: result
    })
  } catch (error) {
    console.error('Database test failed:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}