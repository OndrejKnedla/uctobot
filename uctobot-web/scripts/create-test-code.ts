import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestActivationCode() {
  try {
    // First, create a test user if not exists
    let user = await prisma.user.findUnique({
      where: { email: 'test@uctobot.cz' }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@uctobot.cz',
          name: 'Test User',
          whatsappPhone: '+420777888999',
          companyName: 'Test Company s.r.o.',
          ico: '12345678'
        }
      })
      console.log('Created test user:', user.email)
    }

    // Create activation code
    const code = await prisma.activationCode.create({
      data: {
        code: 'UCTOBOT-ABC123-1234',
        userId: user.id,
        used: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    })

    console.log('✅ Activation code created:', code.code)
    console.log('   User:', user.email)
    console.log('   Expires:', code.expiresAt)
    
  } catch (error) {
    console.error('Error creating activation code:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestActivationCode()