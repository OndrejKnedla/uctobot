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

    // For production without database, we'll just log the subscription
    // In a real production environment, you would:
    // 1. Save to database or external service (like Mailchimp, ConvertKit)
    // 2. Send confirmation email via email service
    
    console.log(`Newsletter subscription from: ${email.toLowerCase()}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Source: blog`);

    // In production, you would integrate with your email marketing service here
    // For example: Mailchimp, ConvertKit, SendGrid, etc.
    
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