import { NextResponse } from 'next/server'
import { sendTestEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log('Attempting to send test email to:', email)
    const result = await sendTestEmail(email)
    
    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully',
        email: email
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send email' 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Test email API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}