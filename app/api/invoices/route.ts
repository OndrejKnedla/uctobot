import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import jwt from 'jsonwebtoken'

// Middleware to verify JWT token
async function verifyToken(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded.userId
  } catch {
    return null
  }
}

// GET all invoices for user
export async function GET(request: Request) {
  const userId = await verifyToken(request)
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: {
        contact: true,
        items: {
          include: {
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST create new invoice
export async function POST(request: Request) {
  const userId = await verifyToken(request)
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { userId },
      orderBy: { invoiceNumber: 'desc' }
    })

    const currentYear = new Date().getFullYear()
    const lastNumber = lastInvoice?.invoiceNumber 
      ? parseInt(lastInvoice.invoiceNumber.split('-')[1] || '0')
      : 0

    const invoiceNumber = `${currentYear}-${String(lastNumber + 1).padStart(4, '0')}`

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        invoiceNumber,
        variableSymbol: data.variableSymbol || invoiceNumber.replace('-', ''),
        contactId: data.contactId,
        subtotal: data.subtotal,
        vatAmount: data.vatAmount,
        total: data.total,
        currency: data.currency || 'CZK',
        issuedDate: new Date(data.issuedDate),
        dueDate: new Date(data.dueDate),
        status: data.status || 'DRAFT',
        note: data.note,
        internalNote: data.internalNote,
        items: {
          create: data.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || 'ks',
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            total: item.total,
            categoryId: item.categoryId
          }))
        }
      },
      include: {
        contact: true,
        items: true
      }
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}