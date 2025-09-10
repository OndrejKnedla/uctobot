import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import crypto from 'crypto'
import { verificationStore } from '@/lib/verification-store'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email je povinný' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Neplatný formát emailu' },
        { status: 400 }
      )
    }

    // Find customer by email in Stripe
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'Zákazník s tímto emailem nebyl nalezen' },
        { status: 404 }
      )
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = Date.now() + (15 * 60 * 1000) // 15 minutes expiration
    
    // Store token
    verificationStore.set(token, { email, expires })

    // Create verification URL
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dokladbot.cz'}/verify-portal?token=${token}`

    // Send verification email using Resend
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: 'DokladBot <send@dokladbot.cz>',
          to: [email],
          subject: '🔐 Ověření přístupu k Customer Portal - DokladBot',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 40px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
                    🔐 Ověření přístupu k portálu
                  </h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    Ahoj!
                  </p>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    Obdrželi jsme žádost o přístup k Customer Portal pro váš DokladBot účet.
                  </p>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    Pro bezpečnost prosím klikněte na tlačítko níže pro ověření, že jste to skutečně vy:
                  </p>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);">
                      🔓 Otevřít Customer Portal
                    </a>
                  </div>
                  
                  <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600;">
                      ⚠️ Důležité informace:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px;">
                      <li style="padding: 2px 0;">Odkaz je platný pouze 15 minut</li>
                      <li style="padding: 2px 0;">Lze použít pouze jednou</li>
                      <li style="padding: 2px 0;">Pokud jste nepožádali o přístup, ignorujte tento email</li>
                    </ul>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    Alternativně můžete zkopírovat tento odkaz do prohlížeče:<br>
                    <a href="${verifyUrl}" style="color: #22c55e; word-break: break-all;">${verifyUrl}</a>
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f3f4f6; padding: 20px 30px; text-align: center;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    © 2025 DokladBot.cz | Automatizace účetnictví pro podnikatele
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
Ověření přístupu k Customer Portal - DokladBot

Ahoj!

Obdrželi jsme žádost o přístup k Customer Portal pro váš DokladBot účet.

Pro bezpečnost prosím klikněte na odkaz níže pro ověření, že jste to skutečně vy:

${verifyUrl}

DŮLEŽITÉ INFORMACE:
- Odkaz je platný pouze 15 minut
- Lze použít pouze jednou  
- Pokud jste nepožádali o přístup, ignorujte tento email

© 2025 DokladBot.cz
          `
        });
        
        console.log(`Verification email sent to: ${email}`);
        
        return NextResponse.json({ 
          success: true,
          message: 'Ověřovací email byl odeslán na vaši adresu. Platnost odkazu je 15 minut.'
        })
        
      } else {
        // Fallback if Resend is not configured
        console.log(`Verification email would be sent to ${email} with URL: ${verifyUrl}`)
        return NextResponse.json({ 
          success: true,
          message: 'Ověřovací email byl odeslán na vaši adresu',
          // Only for testing when Resend is not configured
          verifyUrl: verifyUrl
        })
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return NextResponse.json(
        { error: 'Nepodařilo se odeslat ověřovací email. Zkuste to znovu.' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Chyba při odesílání ověřovacího emailu' },
      { status: 500 }
    )
  }
}

// Debug endpoint to check token stats
export async function GET() {
  const stats = verificationStore.getStats()
  return NextResponse.json(stats)
}