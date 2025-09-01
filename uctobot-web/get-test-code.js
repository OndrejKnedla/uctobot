const { PrismaClient } = require('@prisma/client')

async function getTestCode() {
  const prisma = new PrismaClient()
  
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        ac.code as "Activation Code",
        u.email,
        ac.expiresAt,
        u.registrationStep
      FROM ActivationCode ac
      JOIN User u ON ac.userId = u.id 
      WHERE u.email = 'test@registration.com'
      ORDER BY ac.createdAt DESC 
      LIMIT 1
    `
    
    console.log('🔑 Testovací aktivační kód:')
    console.log(result[0])
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getTestCode()