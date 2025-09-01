import nodemailer from 'nodemailer';
import { generateActivationEmailHTML, generateActivationEmailText, type ActivationEmailData } from './email-templates';

// Create reusable transporter
function createTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email configuration missing. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD environment variables.');
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

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
    whatsappNumber: '+420608123456'
  };

  return await sendActivationEmail(testData);
}