import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default categories
  const incomeCategories = [
    { name: 'Prodej zboží', taxCode: '01' },
    { name: 'Prodej služeb', taxCode: '02' },
    { name: 'Provize', taxCode: '03' },
    { name: 'Ostatní příjmy', taxCode: '99' }
  ]

  const expenseCategories = [
    { name: 'Materiál', taxDeductible: true, taxCode: '501' },
    { name: 'Energie', taxDeductible: true, taxCode: '502' },
    { name: 'Služby', taxDeductible: true, taxCode: '518' },
    { name: 'Mzdy', taxDeductible: true, taxCode: '521' },
    { name: 'Pojištění', taxDeductible: true, taxCode: '524' },
    { name: 'Nájemné', taxDeductible: true, taxCode: '518' },
    { name: 'Marketing', taxDeductible: true, taxCode: '518' },
    { name: 'IT a software', taxDeductible: true, taxCode: '518' },
    { name: 'Doprava', taxDeductible: true, taxCode: '512' },
    { name: 'Kancelářské potřeby', taxDeductible: true, taxCode: '501' },
    { name: 'Telefon a internet', taxDeductible: true, taxCode: '518' },
    { name: 'Vzdělávání', taxDeductible: true, taxCode: '518' },
    { name: 'Reprezentace', taxDeductible: false, taxCode: '513' },
    { name: 'Dary', taxDeductible: false, taxCode: '543' },
    { name: 'Pokuty a penále', taxDeductible: false, taxCode: '545' },
    { name: 'Osobní spotřeba', taxDeductible: false, taxCode: '999' }
  ]

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      whatsappPhone: '+420777888999',
      email: 'demo@dokladbot.cz',
      name: 'Jan Novák',
      companyName: 'Novák Consulting s.r.o.',
      ico: '12345678',
      dic: 'CZ12345678',
      address: 'Václavské náměstí 1',
      city: 'Praha',
      zipCode: '11000',
      country: 'CZ',
      isVatPayer: true,
      vatFrequency: 'MONTHLY',
      accountingType: 'TAX_RECORDS',
      whatsappVerified: true
    }
  })

  console.log('✅ Created demo user')

  // Create subscription for demo user
  await prisma.subscription.create({
    data: {
      userId: demoUser.id,
      plan: 'MONTHLY',
      status: 'ACTIVE',
      price: 299,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isFoundingMember: true,
      lockedPrice: 299
    }
  })

  console.log('✅ Created subscription')

  // Create categories for demo user
  for (const cat of incomeCategories) {
    await prisma.category.create({
      data: {
        userId: demoUser.id,
        name: cat.name,
        type: 'INCOME',
        taxCode: cat.taxCode
      }
    })
  }

  for (const cat of expenseCategories) {
    await prisma.category.create({
      data: {
        userId: demoUser.id,
        name: cat.name,
        type: 'EXPENSE',
        taxDeductible: cat.taxDeductible,
        taxCode: cat.taxCode,
        vatRate: cat.name === 'Reprezentace' ? 0 : 21
      }
    })
  }

  console.log('✅ Created categories')

  // Create some demo contacts
  const customers = [
    {
      name: 'ABC Technologies s.r.o.',
      companyName: 'ABC Technologies s.r.o.',
      ico: '87654321',
      dic: 'CZ87654321',
      email: 'info@abc-tech.cz',
      phone: '+420777111222',
      address: 'Karlova 123',
      city: 'Brno',
      zipCode: '60200'
    },
    {
      name: 'XYZ Services a.s.',
      companyName: 'XYZ Services a.s.',
      ico: '11223344',
      dic: 'CZ11223344',
      email: 'contact@xyz.cz',
      phone: '+420777333444',
      address: 'Dlouhá 456',
      city: 'Ostrava',
      zipCode: '70200'
    }
  ]

  const suppliers = [
    {
      name: 'Dodavatel Energie s.r.o.',
      companyName: 'Dodavatel Energie s.r.o.',
      ico: '55667788',
      dic: 'CZ55667788',
      email: 'fakturace@energie.cz',
      phone: '+420777555666',
      address: 'Energetická 789',
      city: 'Praha',
      zipCode: '10100'
    },
    {
      name: 'Office Supplies CZ',
      companyName: 'Office Supplies CZ s.r.o.',
      ico: '99887766',
      dic: 'CZ99887766',
      email: 'objednavky@office.cz',
      phone: '+420777777888',
      address: 'Skladová 321',
      city: 'Plzeň',
      zipCode: '30100'
    }
  ]

  for (const customer of customers) {
    await prisma.contact.create({
      data: {
        ...customer,
        userId: demoUser.id,
        type: 'CUSTOMER'
      }
    })
  }

  for (const supplier of suppliers) {
    await prisma.contact.create({
      data: {
        ...supplier,
        userId: demoUser.id,
        type: 'SUPPLIER'
      }
    })
  }

  console.log('✅ Created contacts')

  // Create demo bank account
  const bankAccount = await prisma.bankAccount.create({
    data: {
      userId: demoUser.id,
      bankName: 'Česká spořitelna',
      accountNumber: '1234567890',
      bankCode: '0800',
      iban: 'CZ6508000000001234567890',
      currency: 'CZK',
      balance: 150000
    }
  })

  console.log('✅ Created bank account')

  // Create some demo expenses
  const materialovaKategorie = await prisma.category.findFirst({
    where: { userId: demoUser.id, name: 'Materiál' }
  })

  const sluzbyKategorie = await prisma.category.findFirst({
    where: { userId: demoUser.id, name: 'Služby' }
  })

  const dodavatel = await prisma.contact.findFirst({
    where: { userId: demoUser.id, type: 'SUPPLIER' }
  })

  await prisma.expense.create({
    data: {
      userId: demoUser.id,
      expenseNumber: 'V-2024-0001',
      contactId: dodavatel?.id,
      description: 'Nákup kancelářského materiálu',
      subtotal: 5000,
      vatAmount: 1050,
      vatRate: 21,
      total: 6050,
      currency: 'CZK',
      expenseDate: new Date('2024-01-15'),
      type: 'RECEIPT',
      status: 'PAID',
      categoryId: materialovaKategorie?.id,
      aiProcessed: true,
      aiExtractedData: {
        vendor: 'Office Supplies CZ',
        items: ['Papír A4', 'Toner', 'Psací potřeby']
      }
    }
  })

  await prisma.expense.create({
    data: {
      userId: demoUser.id,
      expenseNumber: 'V-2024-0002',
      description: 'Hosting a doména',
      subtotal: 3000,
      vatAmount: 630,
      vatRate: 21,
      total: 3630,
      currency: 'CZK',
      expenseDate: new Date('2024-01-20'),
      type: 'INVOICE',
      status: 'UNPAID',
      categoryId: sluzbyKategorie?.id
    }
  })

  console.log('✅ Created demo expenses')

  // Create demo invoices
  const customer = await prisma.contact.findFirst({
    where: { userId: demoUser.id, type: 'CUSTOMER' }
  })

  const serviceCategory = await prisma.category.findFirst({
    where: { userId: demoUser.id, name: 'Prodej služeb' }
  })

  await prisma.invoice.create({
    data: {
      userId: demoUser.id,
      invoiceNumber: '2024-0001',
      variableSymbol: '20240001',
      contactId: customer?.id,
      subtotal: 25000,
      vatAmount: 5250,
      total: 30250,
      currency: 'CZK',
      issuedDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-15'),
      status: 'PAID',
      paymentDate: new Date('2024-01-10'),
      items: {
        create: [
          {
            description: 'Konzultační služby - leden 2024',
            quantity: 1,
            unit: 'měsíc',
            unitPrice: 25000,
            vatRate: 21,
            total: 30250,
            categoryId: serviceCategory?.id
          }
        ]
      }
    }
  })

  console.log('✅ Created demo invoices')

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })