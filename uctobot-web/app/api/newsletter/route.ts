import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Simulace databáze - v produkci použijte skutečnou databázi
const subscribers = new Set<string>();

// Initialize Resend only if API key exists
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validace emailu
    if (!email) {
      return NextResponse.json(
        { message: 'Email je povinný' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Neplatný formát emailu' },
        { status: 400 }
      );
    }

    // Kontrola duplicit
    if (subscribers.has(email.toLowerCase())) {
      return NextResponse.json(
        { message: 'Tento email je již přihlášen k odběru' },
        { status: 409 }
      );
    }

    // Přidání do newsletteru
    subscribers.add(email.toLowerCase());
    
    // V produkci byste zde:
    // 1. Uložili email do databáze s `confirmed: false`
    // 2. Vygenerovali verification token
    // 3. Poslali potvrzovací email

    // Simulace potvrzovacího emailu
    await sendConfirmationEmail(email);

    console.log(`Newsletter subscription: ${email}`);

    return NextResponse.json(
      { 
        message: 'Úspěšně přihlášen! Zkontrolujte email pro potvrzení.',
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json(
      { message: 'Nastala chyba při zpracování požadavku' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const email = url.searchParams.get('email');
  const token = url.searchParams.get('token');

  if (action === 'confirm' && email && token) {
    // V produkci byste ověřili token a označili email jako potvrzený
    return NextResponse.json(
      { message: 'Email úspěšně potvrzen!' },
      { status: 200 }
    );
  }

  if (action === 'unsubscribe' && email && token) {
    // V produkci byste ověřili token a odstranili email z databáze
    subscribers.delete(email.toLowerCase());
    
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Odhlášení z newsletteru | DokladBot</title>
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
          <div class="success">✅ Úspěšně odhlášen</div>
          <p class="description">
            Email <strong>${email}</strong> byl úspěšně odhlášen z našeho newsletteru. 
            Nebudete dostávat další zprávy.
          </p>
          <p class="description">
            Pokud si to rozmyslíte, můžete se kdykoli znovu přihlásit na našem webu.
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

  return NextResponse.json(
    { message: 'Newsletter API' },
    { status: 200 }
  );
}

// Odeslání potvrzovacího emailu
async function sendConfirmationEmail(email: string) {
  const confirmToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dokladbot.cz'}/api/newsletter?action=confirm&email=${encodeURIComponent(email)}&token=${confirmToken}`;
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dokladbot.cz'}/api/newsletter?action=unsubscribe&email=${encodeURIComponent(email)}&token=${confirmToken}`;
  
  const emailContent = `
Ahoj!

Děkujeme za přihlášení k našemu newsletteru pro podnikatele.

Pro potvrzení odběru klikněte zde: ${confirmUrl}

Co vám budeme posílat:
✅ Daňové změny a novinky
✅ Tipy na úsporu času a peněz
✅ Nové funkce DokladBotu
✅ Praktické návody pro podnikatele

Maximálně 1x měsíčně, žádný spam!

Pokud si odběr nepřejete, můžete se odhlásit zde: ${unsubscribeUrl}

S pozdravem,
Tým DokladBot

--
DokladBot.cz - Účetnictví přes WhatsApp
  `.trim();

  // Production: Use Resend to send actual email
  if (resend && process.env.NODE_ENV === 'production') {
    try {
      await resend.emails.send({
        from: 'DokladBot <newsletter@dokladbot.cz>',
        to: [email],
        subject: 'Potvrďte odběr newsletteru DokladBot',
        text: emailContent,
        html: `
          <!DOCTYPE html>
          <html lang="cs">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Potvrďte odběr newsletteru DokladBot</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; background-color: #f9fafb; }
              .container { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { text-align: center; margin-bottom: 2rem; }
              .logo { color: #22c55e; font-size: 2rem; font-weight: bold; }
              .content { color: #374151; line-height: 1.6; }
              .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 1rem 0; font-weight: 600; }
              .features { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 1rem; margin: 1rem 0; }
              .footer { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.875rem; }
              .unsubscribe { color: #9ca3af; font-size: 0.75rem; margin-top: 1rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">📧 DokladBot</div>
                <h1 style="color: #1f2937; margin-top: 0.5rem;">Potvrďte odběr newsletteru</h1>
              </div>
              
              <div class="content">
                <p>Ahoj!</p>
                <p>Děkujeme za přihlášení k našemu newsletteru pro podnikatele.</p>
                
                <div style="text-align: center; margin: 2rem 0;">
                  <a href="${confirmUrl}" class="button">✅ Potvrdit odběr</a>
                </div>
                
                <div class="features">
                  <h3 style="margin-top: 0; color: #15803d;">Co vám budeme posílat:</h3>
                  <ul style="margin: 0; padding-left: 1.5rem;">
                    <li>✅ Daňové změny a novinky</li>
                    <li>✅ Tipy na úsporu času a peněz</li>
                    <li>✅ Nové funkce DokladBotu</li>
                    <li>✅ Praktické návody pro podnikatele</li>
                  </ul>
                  <p style="margin-bottom: 0;"><strong>Maximálně 1x měsíčně, žádný spam!</strong></p>
                </div>
                
                <div class="footer">
                  <p><strong>S pozdravem,<br>Tým DokladBot</strong></p>
                  <p style="margin: 0;">DokladBot.cz - Účetnictví přes WhatsApp</p>
                </div>
                
                <div class="unsubscribe">
                  <p>Pokud si odběr nepřejete, můžete se <a href="${unsubscribeUrl}" style="color: #9ca3af;">odhlásit zde</a>.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      });
      
      console.log(`✅ Newsletter confirmation email sent to: ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send confirmation email:', error);
      return false;
    }
  } else {
    // Development: Log to console
    console.log(`
    📧 POTVRZOVACÍ EMAIL PRO: ${email}
    
    Předmět: Potvrďte odběr newsletteru DokladBot
    
    Obsah:
    ======
    ${emailContent}
    ======
  `);
    return true;
  }
}