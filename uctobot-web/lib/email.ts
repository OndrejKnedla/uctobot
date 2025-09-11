const nodemailer = require('nodemailer');
import { generateActivationEmailHTML, generateActivationEmailText, type ActivationEmailData } from './email-templates';

// Create reusable transporter
function createTransporter() {
  // Use Forpsi SMTP settings if EMAIL_HOST is not set
  const host = process.env.EMAIL_HOST || 'mail.forpsi.com';
  const user = process.env.EMAIL_USER || 'info@dokladbot.cz';
  const password = process.env.EMAIL_PASSWORD;

  if (!password) {
    throw new Error('Email password missing. Please set EMAIL_PASSWORD environment variable.');
  }

  return nodemailer.createTransporter({
    host,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false // For compatibility with some SMTP servers
    }
  });
}

// Generic email sending function
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: options.from || {
        name: 'DokladBot',
        address: process.env.EMAIL_USER || 'info@dokladbot.cz'
      },
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

export async function sendActivationEmail(data: ActivationEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'DokladBot',
        address: 'info@dokladbot.cz'
      },
      to: data.customerEmail,
      subject: `🔑 Váš aktivační kód pro DokladBot (${data.activationCode})`,
      text: generateActivationEmailText(data),
      html: generateActivationEmailHTML(data),
      // Add some metadata
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Activation email sent successfully:', {
      messageId: result.messageId,
      to: data.customerEmail,
      activationCode: data.activationCode
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to send activation email:', error);
    
    // Don't throw error - we don't want payment to fail if email fails
    // Just log it and continue
    return false;
  }
}

// Test email function for development
export async function sendTestEmail(testEmail: string): Promise<boolean> {
  const testData: ActivationEmailData = {
    customerName: 'Jan Testovací',
    customerEmail: testEmail,
    activationCode: 'DOKLADBOT-TEST123-9999',
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleString('cs-CZ'),
    plan: 'YEARLY',
    isFoundingMember: true,
    whatsappNumber: '+420722158002'
  };

  return await sendActivationEmail(testData);
}

// Newsletter email functions
export const sendNewsletterConfirmation = async (
  email: string, 
  confirmationToken: string
): Promise<boolean> => {
  const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dokladbot.cz'}/newsletter/confirm?token=${confirmationToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Potvrzení odběru newsletteru - DokladBot</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <div style="font-size: 36px; margin-bottom: 10px;">🤖</div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">DokladBot</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Účetnictví přes WhatsApp</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Potvrďte váš odběr newsletteru</h2>
                
                <p style="color: #6b7280; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                    Děkujeme za zájem o náš newsletter! Budeme vám posílat praktické tipy pro podnikatele maximálně 1x měsíčně.
                </p>
                
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">📧 Co od nás dostanete:</h3>
                    <ul style="color: #166534; margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">Aktuální daňové změny a termíny</li>
                        <li style="margin-bottom: 8px;">Praktické tipy na úsporu času a peněz</li>
                        <li style="margin-bottom: 8px;">Novinky v DokladBot aplikaci</li>
                        <li style="margin-bottom: 8px;">Exkluzivní obsahy pro podnikatele</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmationUrl}" 
                       style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        ✅ Potvrdit odběr newsletteru
                    </a>
                </div>
                
                <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 25px 0 0 0;">
                    Pokud se tlačítko nezobrazuje správně, zkopírujte tento odkaz do prohlížeče:<br>
                    <a href="${confirmationUrl}" style="color: #16a34a; word-break: break-all;">${confirmationUrl}</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
                    Tento email byl odeslán na základě vaší žádosti o odběr newsletteru na webu DokladBot.cz<br>
                    Pokud jste newsletter nepožadovali, tento email ignorujte.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
Potvrďte váš odběr newsletteru - DokladBot

Děkujeme za zájem o náš newsletter! Budeme vám posílat praktické tipy pro podnikatele maximálně 1x měsíčně.

Co od nás dostanete:
• Aktuální daňové změny a termíny
• Praktické tipy na úsporu času a peněz  
• Novinky v DokladBot aplikaci
• Exkluzivní obsahy pro podnikatele

Pro potvrzení klikněte na tento odkaz:
${confirmationUrl}

Pokud jste newsletter nepožadovali, tento email ignorujte.

--
DokladBot - Účetnictví přes WhatsApp
https://www.dokladbot.cz
  `;

  return await sendEmail({
    to: email,
    subject: '📧 Potvrďte odběr newsletteru - DokladBot',
    text,
    html,
  });
};

export const sendNewsletterWelcome = async (email: string): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vítejte v DokladBot newsletteru!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Vítejte v DokladBot!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Úspěšně jste se přihlásili k newsletteru</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <p style="color: #6b7280; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                    Děkujeme za potvrzení! Právě jste se stali součástí komunity moderních podnikatelů, kteří využívají technologie pro jednodušší účetnictví.
                </p>
                
                <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">🚀 Začněte používat DokladBot hned!</h3>
                    <p style="color: #166534; margin: 0 0 15px 0; line-height: 1.5;">
                        Zkuste si naši AI asistentku pro účetnictví zdarma na 7 dní. Stačí poslat zprávu "Ahoj" na WhatsApp!
                    </p>
                    <a href="https://wa.me/420774553535?text=Ahoj" 
                       style="display: inline-block; background: #25d366; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; font-size: 14px;">
                        💬 Začít na WhatsApp
                    </a>
                </div>
                
                <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h3 style="color: #a16207; margin: 0 0 15px 0; font-size: 18px;">💡 Nejpopulárnější články:</h3>
                    <ul style="color: #a16207; margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">
                            <a href="https://www.dokladbot.cz/blog/jak-na-ucetnictvi-osvc-2025" style="color: #a16207; text-decoration: none;">
                                Jak na účetnictví OSVČ v 2025 →
                            </a>
                        </li>
                        <li style="margin-bottom: 8px;">
                            <a href="https://www.dokladbot.cz/blog/danove-odpocty-zivnostnici-2025" style="color: #a16207; text-decoration: none;">
                                Daňové odpočty pro živnostníky 2025 →
                            </a>
                        </li>
                        <li style="margin-bottom: 8px;">
                            <a href="https://www.dokladbot.cz/blog/dph-osvc-kompletni-pruvodce-2025" style="color: #a16207; text-decoration: none;">
                                DPH pro OSVČ - kompletní průvodce →
                            </a>
                        </li>
                    </ul>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <div style="text-align: center;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">
                        Máte otázku? Napište nám kdykoli!
                    </p>
                    <p style="margin: 0;">
                        <a href="mailto:info@dokladbot.cz" style="color: #16a34a; text-decoration: none; margin: 0 10px;">
                            📧 info@dokladbot.cz
                        </a>
                        <a href="https://www.dokladbot.cz" style="color: #16a34a; text-decoration: none; margin: 0 10px;">
                            🌐 www.dokladbot.cz
                        </a>
                    </p>
                </div>
                
                <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 25px 0 0 0;">
                    Newsletter můžete kdykoliv zrušit kliknutím na odkaz v patičce každého emailu.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
Vítejte v DokladBot! 🎉

Úspěšně jste se přihlásili k newsletteru

Děkujeme za potvrzení! Právě jste se stali součástí komunity moderních podnikatelů, kteří využívají technologie pro jednodušší účetnictví.

🚀 Začněte používat DokladBot hned!
Zkuste si naši AI asistentku pro účetnictví zdarma na 7 dní. Stačí poslat zprávu "Ahoj" na WhatsApp: https://wa.me/420774553535?text=Ahoj

💡 Nejpopulárnější články:
• Jak na účetnictví OSVČ v 2025: https://www.dokladbot.cz/blog/jak-na-ucetnictvi-osvc-2025
• Daňové odpočty pro živnostníky 2025: https://www.dokladbot.cz/blog/danove-odpocty-zivnostnici-2025  
• DPH pro OSVČ - kompletní průvodce: https://www.dokladbot.cz/blog/dph-osvc-kompletni-pruvodce-2025

Máte otázku? Napište nám kdykoli!
📧 info@dokladbot.cz
🌐 www.dokladbot.cz

--
Newsletter můžete kdykoliv zrušit kliknutím na odkaz v patičce každého emailu.
  `;

  return await sendEmail({
    to: email,
    subject: '🎉 Vítejte v DokladBot newsletteru!',
    text,
    html,
  });
};