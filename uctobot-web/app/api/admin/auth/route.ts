import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    
    // Get admin password from environment variable
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
    
    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD not set in environment variables')
      return NextResponse.json(
        { success: false, error: 'Admin access not configured' },
        { status: 503 }
      )
    }
    
    // Check credentials
    if (username === 'admin' && password === ADMIN_PASSWORD) {
      return NextResponse.json({ 
        success: true,
        message: 'Authentication successful'
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    )
    
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}