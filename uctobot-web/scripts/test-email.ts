import { sendTestEmail } from '@/lib/email';

async function testEmail() {
  const testEmailAddress = process.argv[2];
  
  if (!testEmailAddress) {
    console.error('❌ Please provide an email address as argument:');
    console.error('   npx tsx scripts/test-email.ts your@email.com');
    process.exit(1);
  }

  console.log(`🧪 Testing email sending to: ${testEmailAddress}`);
  console.log('📧 Sending test activation email...');
  
  try {
    const result = await sendTestEmail(testEmailAddress);
    
    if (result) {
      console.log('✅ Test email sent successfully!');
      console.log('📬 Check your inbox (and spam folder)');
    } else {
      console.log('❌ Test email failed to send');
      console.log('🔧 Check your email configuration in .env file:');
      console.log('   - EMAIL_HOST');
      console.log('   - EMAIL_USER (info@dokladbot.cz)');
      console.log('   - EMAIL_PASSWORD');
    }
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

testEmail();