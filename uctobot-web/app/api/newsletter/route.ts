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
        
        await resend.emails.send({
          from: 'DokladBot Newsletter <send@dokladbot.cz>', // Používáme vaši ověřenou doménu
          to: ['realok2001@gmail.com'], // Váš osobní email
          subject: `🎉 Nový newsletter subscriber: ${email}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #22c55e;">Nová newsletter registrace</h2>
              <p><strong>Email:</strong> ${email.toLowerCase()}</p>
              <p><strong>Čas:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
              <p><strong>Zdroj:</strong> Blog</p>
              
              <hr style="margin: 20px 0;">
              
              <p><strong>Akce:</strong></p>
              <ul>
                <li>Přidejte tento email do vašeho email marketing systému</li>
                <li>Pošlete uvítací email s nejlepšími články</li>
                <li>Nastavte pravidelné newsletter kampaně</li>
              </ul>
            </div>
          `,
          text: `
Nová newsletter registrace!

Email: ${email.toLowerCase()}
Čas: ${new Date().toLocaleString('cs-CZ')}
Zdroj: Blog

Přidejte tento email do vašeho email marketing systému.
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