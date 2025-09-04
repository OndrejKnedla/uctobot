import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('Newsletter API called');
  try {
    const { email } = await request.json();
    console.log('Email received:', email);

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Email je povinný' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Prosím zadejte platný email' },
        { status: 400 }
      );
    }

    // Log the subscription
    console.log(`Newsletter subscription from: ${email.toLowerCase()}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Source: blog`);

    // Send notification email to admin using Resend
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Send notification to admin
        await resend.emails.send({
          from: 'DokladBot <send@dokladbot.cz>',
          to: ['realok2001@gmail.com'],
          subject: `📮 Nová registrace do newsletteru`,
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
                    ✨ Nový odběratel newsletteru!
                  </h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <p style="margin: 0; color: #15803d; font-size: 18px; font-weight: 600;">
                      Subscriber Details
                    </p>
                    <table style="margin-top: 15px; width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${email.toLowerCase()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Čas registrace:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${new Date().toLocaleString('cs-CZ')}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Zdroj:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">Blog DokladBot</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                    <p style="margin: 0 0 15px 0; color: #92400e; font-size: 16px; font-weight: 600;">
                      📋 Doporučené kroky:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                      <li style="padding: 5px 0;">Přidat email do Mailchimp/SendGrid nebo jiného email nástroje</li>
                      <li style="padding: 5px 0;">Odeslat uvítací email s top obsahem</li>
                      <li style="padding: 5px 0;">Zařadit do pravidelné newsletter kampaně</li>
                    </ul>
                  </div>
                  
                  <!-- Stats -->
                  <div style="text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Tento email byl automaticky vygenerován z DokladBot.cz
                    </p>
                  </div>
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
Nový odběratel newsletteru!

Email: ${email.toLowerCase()}
Čas registrace: ${new Date().toLocaleString('cs-CZ')}
Zdroj: Blog DokladBot

Doporučené kroky:
- Přidat email do email marketing nástroje
- Odeslat uvítací email
- Zařadit do newsletter kampaně

DokladBot.cz
          `
        });
        
        // Send welcome email to new subscriber
        await resend.emails.send({
          from: 'DokladBot <send@dokladbot.cz>',
          to: [email.toLowerCase()],
          subject: 'Vítejte v DokladBot newsletteru! 🎉',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 40px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header with gradient -->
                <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 60px 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600;">
                    Vítejte v DokladBot newsletteru!
                  </h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 18px;">
                    Vaše cesta k jednoduššímu účetnictví začíná zde
                  </p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    Děkujeme za váš zájem o DokladBot newsletter! 
                  </p>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    Každý měsíc vám budeme zasílat:
                  </p>
                  
                  <ul style="margin: 0 0 30px 0; padding-left: 0; list-style: none;">
                    <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="display: inline-block; width: 30px; color: #22c55e; font-size: 20px;">✓</span>
                      <span style="color: #374151; font-size: 15px;">Tipy pro efektivní správu účetnictví</span>
                    </li>
                    <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="display: inline-block; width: 30px; color: #22c55e; font-size: 20px;">✓</span>
                      <span style="color: #374151; font-size: 15px;">Novinky ze světa daní a legislativy</span>
                    </li>
                    <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="display: inline-block; width: 30px; color: #22c55e; font-size: 20px;">✓</span>
                      <span style="color: #374151; font-size: 15px;">Praktické návody pro podnikatele</span>
                    </li>
                    <li style="padding: 12px 0;">
                      <span style="display: inline-block; width: 30px; color: #22c55e; font-size: 20px;">✓</span>
                      <span style="color: #374151; font-size: 15px;">Exkluzivní nabídky a slevy</span>
                    </li>
                  </ul>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="https://www.dokladbot.cz/blog" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);">
                      Přečíst nejnovější články →
                    </a>
                  </div>
                  
                  <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <p style="margin: 0; color: #15803d; font-size: 14px; text-align: center;">
                      💡 <strong>Tip:</strong> Přidejte si naši adresu send@dokladbot.cz do kontaktů, aby vám naše emaily nechodily do spamu.
                    </p>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f3f4f6; padding: 30px; text-align: center;">
                  <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
                    Sledujte nás na sociálních sítích
                  </p>
                  
                  <div style="margin: 20px 0;">
                    <a href="https://www.dokladbot.cz" style="color: #22c55e; text-decoration: none; margin: 0 10px;">Web</a>
                    <span style="color: #d1d5db;">|</span>
                    <a href="https://www.dokladbot.cz/blog" style="color: #22c55e; text-decoration: none; margin: 0 10px;">Blog</a>
                  </div>
                  
                  <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © 2025 DokladBot.cz | Všechna práva vyhrazena
                  </p>
                  
                  <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 11px;">
                    Tento email jste obdrželi, protože jste se přihlásili k odběru newsletteru na dokladbot.cz<br>
                    <a href="mailto:info@dokladbot.cz?subject=Odhlášení z newsletteru&body=Přeji si odhlásit email ${email} z newsletteru." style="color: #6b7280; text-decoration: underline;">Odhlásit se z newsletteru</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
Vítejte v DokladBot newsletteru!

Děkujeme za váš zájem o DokladBot newsletter!

Každý měsíc vám budeme zasílat:
✓ Tipy pro efektivní správu účetnictví
✓ Novinky ze světa daní a legislativy  
✓ Praktické návody pro podnikatele
✓ Exkluzivní nabídky a slevy

Přečtěte si nejnovější články na: https://www.dokladbot.cz/blog

Tip: Přidejte si naši adresu send@dokladbot.cz do kontaktů, aby vám naše emaily nechodily do spamu.

© 2025 DokladBot.cz

Pro odhlášení z newsletteru odpovězte na tento email s žádostí o odhlášení.
          `
        });
        
        console.log(`Admin notification sent for: ${email}`);
      }
    } catch (error) {
      console.error('Failed to send admin notification:', error);
      // Don't fail the whole request if notification fails
    }
    
    return NextResponse.json({
      message: 'Děkujeme za zájem o newsletter! Brzy budeme v kontaktu.',
      success: true
    });

  } catch (error) {
    console.error('Newsletter signup error:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json(
      { 
        message: 'Nastala chyba při zpracování žádosti',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  // Simple thank you page for any newsletter action
  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Děkujeme | DokladBot</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; }
        .card { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 2rem; text-align: center; }
        .success { color: #15803d; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
        .description { color: #374151; line-height: 1.6; }
        .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 1rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="success">🎉 Děkujeme!</div>
        <p class="description">
          Váš zájem o DokladBot newsletter byl zaregistrován. Brzy budeme v kontaktu s užitečnými tipy pro podnikatele!
        </p>
        <a href="https://www.dokladbot.cz/blog" class="button">Návrat na blog</a>
      </div>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}