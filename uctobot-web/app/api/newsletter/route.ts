import { NextRequest, NextResponse } from 'next/server';

// Simulace databáze - v produkci použijte skutečnou databázi
const subscribers = new Set<string>();

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

// Simulace odeslání potvrzovacího emailu
async function sendConfirmationEmail(email: string) {
  // V produkci byste použili službu jako Resend, SendGrid, nebo SMTP
  const confirmToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dokladbot.cz'}/api/newsletter?action=confirm&email=${encodeURIComponent(email)}&token=${confirmToken}`;
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dokladbot.cz'}/api/newsletter?action=unsubscribe&email=${encodeURIComponent(email)}&token=${confirmToken}`;
  
  console.log(`
    📧 POTVRZOVACÍ EMAIL PRO: ${email}
    
    Předmět: Potvrďte odběr newsletteru DokladBot
    
    Obsah:
    ======
    Ahoj!
    
    Děkujeme za přihlášení k našemu newsletteru pro OSVČ a podnikatele.
    
    Pro potvrzení odběru klikněte zde: ${confirmUrl}
    
    Co vám budeme posílat:
    ✅ Daňové změny a novinky
    ✅ Tipy na úsporu času a peněz
    ✅ Nové funkce DokladBotu
    ✅ Praktické návody pro OSVČ
    
    Maximálně 1x měsíčně, žádný spam!
    
    Pokud si odběr nepřejete, můžete se odhlásit zde: ${unsubscribeUrl}
    
    S pozdravem,
    Tým DokladBot
    
    --
    DokladBot.cz - Účetnictví přes WhatsApp
    ======
  `);

  // V produkci by zde byl skutečný kód pro odeslání emailu
  return true;
}