import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendNewsletterConfirmation } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

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

    // Check if email already exists
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingSubscriber) {
      if (existingSubscriber.confirmedAt) {
        return NextResponse.json(
          { message: 'Tento email je již přihlášen k newsletteru' },
          { status: 409 }
        );
      } else {
        // Resend confirmation email
        const success = await sendNewsletterConfirmation(
          email.toLowerCase(), 
          existingSubscriber.unsubscribeToken
        );

        if (success) {
          return NextResponse.json({
            message: 'Potvrzovací email byl znovu odeslán',
            success: true
          });
        } else {
          return NextResponse.json(
            { message: 'Chyba při odesílání emailu. Zkuste to později.' },
            { status: 500 }
          );
        }
      }
    }

    // Create new subscriber
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: email.toLowerCase(),
        source: 'blog',
        isActive: true,
      }
    });

    // Send confirmation email
    const success = await sendNewsletterConfirmation(
      email.toLowerCase(), 
      subscriber.unsubscribeToken
    );

    if (success) {
      return NextResponse.json({
        message: 'Potvrzovací email byl odeslán. Zkontrolujte svou schránku.',
        success: true
      });
    } else {
      // Even if email fails, we created the subscriber
      return NextResponse.json(
        { message: 'Přihlášení proběhlo, ale nepodařilo se odeslat potvrzovací email.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json(
      { message: 'Nastala chyba při zpracování žádosti' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const token = url.searchParams.get('token');

  if (action === 'confirm' && token) {
    try {
      // Find subscriber by token
      const subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { unsubscribeToken: token }
      });

      if (!subscriber) {
        return new NextResponse(`
          <!DOCTYPE html>
          <html lang="cs">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Neplatný odkaz | DokladBot</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; }
              .card { background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 2rem; text-align: center; }
              .error { color: #dc2626; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
              .description { color: #374151; line-height: 1.6; }
              .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 1rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="error">❌ Neplatný odkaz</div>
              <p class="description">
                Tento odkaz není platný nebo již vypršel.
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

      if (subscriber.confirmedAt) {
        return new NextResponse(`
          <!DOCTYPE html>
          <html lang="cs">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Již potvrzeno | DokladBot</title>
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
              <div class="success">✅ Již potvrzeno</div>
              <p class="description">
                Váš email <strong>${subscriber.email}</strong> je již potvrzen a aktivní.
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

      // Confirm the subscriber
      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: { 
          confirmedAt: new Date(),
          isActive: true
        }
      });

      // Send welcome email
      const { sendNewsletterWelcome } = await import('@/lib/email');
      await sendNewsletterWelcome(subscriber.email);

      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="cs">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Úspěšně potvrzeno | DokladBot</title>
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
            <div class="success">🎉 Úspěšně potvrzeno!</div>
            <p class="description">
              Děkujeme! Váš email <strong>${subscriber.email}</strong> byl úspěšně potvrzen.
              Budeme vám posílat praktické tipy pro podnikatele maximálně 1x měsíčně.
            </p>
            <p class="description">
              Brzy vám pošleme uvítací email s nejpopulárnějšími články.
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

    } catch (error) {
      console.error('Newsletter confirmation error:', error);
      return NextResponse.json(
        { message: 'Chyba při potvrzování emailu' },
        { status: 500 }
      );
    }
  }

  if (action === 'unsubscribe' && token) {
    try {
      // Find subscriber by token
      const subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { unsubscribeToken: token }
      });

      if (!subscriber) {
        return new NextResponse(`
          <!DOCTYPE html>
          <html lang="cs">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Neplatný odkaz | DokladBot</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; }
              .card { background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 2rem; text-align: center; }
              .error { color: #dc2626; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
              .description { color: #374151; line-height: 1.6; }
              .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 1rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="error">❌ Neplatný odkaz</div>
              <p class="description">
                Tento odkaz není platný nebo již vypršel.
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

      // Unsubscribe
      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: { 
          isActive: false,
          unsubscribedAt: new Date()
        }
      });

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
              Email <strong>${subscriber.email}</strong> byl úspěšně odhlášen z našeho newsletteru. 
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

    } catch (error) {
      console.error('Newsletter unsubscribe error:', error);
      return NextResponse.json(
        { message: 'Chyba při odhlašování z newsletteru' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { message: 'Newsletter API' },
    { status: 200 }
  );
}