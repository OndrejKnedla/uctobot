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

// GET all expenses for user
export async function GET(request: Request) {
  const userId = await verifyToken(request)
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')

    const where: any = { userId }

    if (startDate && endDate) {
      where.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (status) {
      where.status = status
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        contact: true,
        category: true,
        documents: true,
        bankTransaction: true
      },
      orderBy: { expenseDate: 'desc' }
    })

    // Calculate summary
    const summary = {
      total: expenses.reduce((sum, exp) => sum + Number(exp.total), 0),
      vatTotal: expenses.reduce((sum, exp) => sum + Number(exp.vatAmount), 0),
      count: expenses.length,
      byCategory: {} as Record<string, number>
    }

    expenses.forEach(exp => {
      const catName = exp.category?.name || 'Nezařazeno'
      summary.byCategory[catName] = (summary.byCategory[catName] || 0) + Number(exp.total)
    })

    return NextResponse.json({ expenses, summary })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

// POST create new expense
export async function POST(request: Request) {
  const userId = await verifyToken(request)
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    // Generate expense number
    const lastExpense = await prisma.expense.findFirst({
      where: { userId },
      orderBy: { expenseNumber: 'desc' }
    })

    const currentYear = new Date().getFullYear()
    const lastNumber = lastExpense?.expenseNumber 
      ? parseInt(lastExpense.expenseNumber.split('-')[2] || '0')
      : 0

    const expenseNumber = `V-${currentYear}-${String(lastNumber + 1).padStart(4, '0')}`

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        userId,
        expenseNumber,
        contactId: data.contactId,
        description: data.description,
        subtotal: data.subtotal,
        vatAmount: data.vatAmount,
        vatRate: data.vatRate,
        total: data.total,
        currency: data.currency || 'CZK',
        expenseDate: new Date(data.expenseDate),
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
        type: data.type || 'RECEIPT',
        status: data.status || 'UNPAID',
        categoryId: data.categoryId,
        aiProcessed: data.aiProcessed || false,
        aiExtractedData: data.aiExtractedData,
        whatsappMessageId: data.whatsappMessageId,
        bankTransactionId: data.bankTransactionId
      },
      include: {
        contact: true,
        category: true,
        documents: true
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}

// PUT update expense (for AI processing)
export async function PUT(request: Request) {
  const userId = await verifyToken(request)
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, ...data } = await request.json()

    const expense = await prisma.expense.update({
      where: { 
        id,
        userId // Ensure user owns this expense
      },
      data: {
        ...data,
        aiProcessed: true,
        aiExtractedData: data.aiExtractedData
      },
      include: {
        contact: true,
        category: true,
        documents: true
      }
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}