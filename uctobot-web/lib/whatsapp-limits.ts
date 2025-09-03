import { prisma } from '@/lib/db/prisma'
import { PlanType, SubscriptionStatus } from '@prisma/client'

// WhatsApp bot limits configuration
export const WHATSAPP_LIMITS = {
  TRIAL: {
    dailyMessages: 10,
    monthlyMessages: 50,
    documentsPerDay: 5,
    documentsPerMonth: 20
  },
  MONTHLY: {
    dailyMessages: 100,
    monthlyMessages: 1000,
    documentsPerDay: 25,
    documentsPerMonth: 500
  },
  YEARLY: {
    dailyMessages: 150,
    monthlyMessages: 2000,
    documentsPerDay: 50,
    documentsPerMonth: 1000
  },
  // Rate limiting (to prevent spam)
  RATE_LIMIT: {
    messagesPerMinute: 5,
    messagesPerHour: 60
  }
} as const

export interface WhatsAppUsage {
  dailyMessages: number
  monthlyMessages: number
  dailyDocuments: number
  monthlyDocuments: number
  lastMessageTime?: Date
  messagesThisMinute: number
  messagesThisHour: number
}

export class WhatsAppLimitManager {
  
  /**
   * Check if user can send a message based on their subscription and current usage
   */
  static async canSendMessage(userId: string): Promise<{
    allowed: boolean
    reason?: string
    remaining?: {
      dailyMessages: number
      monthlyMessages: number
    }
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user) {
      return { allowed: false, reason: 'Uživatel nenalezen' }
    }

    if (!user.subscription) {
      return { allowed: false, reason: 'Aktivní předplatné nenalezeno' }
    }

    // Check subscription status
    if (user.subscription.status === 'CANCELLED' || user.subscription.status === 'EXPIRED') {
      return { allowed: false, reason: 'Předplatné je neaktivní. Obnovte si předplatné pro pokračování.' }
    }

    // Get current usage
    const usage = await this.getCurrentUsage(userId)
    const limits = this.getLimitsForPlan(user.subscription.plan, user.subscription.status)

    // Check daily limit
    if (usage.dailyMessages >= limits.dailyMessages) {
      return { 
        allowed: false, 
        reason: `Dosáhli jste denního limitu ${limits.dailyMessages} zpráv. Zkuste to zítra.`
      }
    }

    // Check monthly limit
    if (usage.monthlyMessages >= limits.monthlyMessages) {
      return { 
        allowed: false, 
        reason: `Dosáhli jste měsíčního limitu ${limits.monthlyMessages} zpráv. Upgradujte předplatné nebo počkejte do příštího měsíce.`
      }
    }

    // Check rate limiting
    const now = new Date()
    if (usage.lastMessageTime && now.getTime() - usage.lastMessageTime.getTime() < 60000) {
      if (usage.messagesThisMinute >= WHATSAPP_LIMITS.RATE_LIMIT.messagesPerMinute) {
        return { 
          allowed: false, 
          reason: 'Příliš rychle posíláte zprávy. Počkejte chvilku.'
        }
      }
    }

    if (usage.messagesThisHour >= WHATSAPP_LIMITS.RATE_LIMIT.messagesPerHour) {
      return { 
        allowed: false, 
        reason: 'Dosáhli jste hodinového limitu zpráv. Zkuste to za hodinu.'
      }
    }

    return {
      allowed: true,
      remaining: {
        dailyMessages: limits.dailyMessages - usage.dailyMessages,
        monthlyMessages: limits.monthlyMessages - usage.monthlyMessages
      }
    }
  }

  /**
   * Check if user can process a document
   */
  static async canProcessDocument(userId: string): Promise<{
    allowed: boolean
    reason?: string
    remaining?: {
      dailyDocuments: number
      monthlyDocuments: number
    }
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user?.subscription) {
      return { allowed: false, reason: 'Aktivní předplatné nenalezeno' }
    }

    const usage = await this.getCurrentUsage(userId)
    const limits = this.getLimitsForPlan(user.subscription.plan, user.subscription.status)

    if (usage.dailyDocuments >= limits.documentsPerDay) {
      return { 
        allowed: false, 
        reason: `Dosáhli jste denního limitu ${limits.documentsPerDay} dokumentů.`
      }
    }

    if (usage.monthlyDocuments >= limits.documentsPerMonth) {
      return { 
        allowed: false, 
        reason: `Dosáhli jste měsíčního limitu ${limits.documentsPerMonth} dokumentů.`
      }
    }

    return {
      allowed: true,
      remaining: {
        dailyDocuments: limits.documentsPerDay - usage.dailyDocuments,
        monthlyDocuments: limits.documentsPerMonth - usage.monthlyDocuments
      }
    }
  }

  /**
   * Record a message usage
   */
  static async recordMessageUsage(userId: string): Promise<void> {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Update daily usage
    await prisma.whatsAppUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: {
        messagesCount: { increment: 1 },
        lastActivityAt: now
      },
      create: {
        userId,
        date: today,
        messagesCount: 1,
        documentsCount: 0,
        lastActivityAt: now
      }
    })

    // Update rate limiting
    await this.updateRateLimit(userId, 'minute')
    await this.updateRateLimit(userId, 'hour')

    // Update user last activity
    await prisma.user.update({
      where: { id: userId },
      data: { lastWhatsappActivity: now }
    })
  }

  /**
   * Record a document processing usage
   */
  static async recordDocumentUsage(userId: string): Promise<void> {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Update daily usage
    await prisma.whatsAppUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: {
        documentsCount: { increment: 1 },
        lastActivityAt: now
      },
      create: {
        userId,
        date: today,
        messagesCount: 0,
        documentsCount: 1,
        lastActivityAt: now
      }
    })

    // Also record as a message (since document processing involves WhatsApp communication)
    await this.recordMessageUsage(userId)
  }

  /**
   * Update rate limiting counters
   */
  private static async updateRateLimit(userId: string, windowType: 'minute' | 'hour'): Promise<void> {
    const now = new Date()
    let windowStart: Date

    if (windowType === 'minute') {
      windowStart = new Date()
      windowStart.setSeconds(0, 0)
    } else {
      windowStart = new Date()
      windowStart.setMinutes(0, 0, 0)
    }

    await prisma.whatsAppRateLimit.upsert({
      where: {
        userId_windowType_windowStart: {
          userId,
          windowType,
          windowStart
        }
      },
      update: {
        requestCount: { increment: 1 }
      },
      create: {
        userId,
        windowType,
        windowStart,
        requestCount: 1
      }
    })
  }

  /**
   * Get usage limits for a specific plan
   */
  private static getLimitsForPlan(plan: PlanType, status: SubscriptionStatus) {
    if (status === 'TRIAL') {
      return WHATSAPP_LIMITS.TRIAL
    }
    
    switch (plan) {
      case 'YEARLY':
        return WHATSAPP_LIMITS.YEARLY
      case 'MONTHLY':
      default:
        return WHATSAPP_LIMITS.MONTHLY
    }
  }

  /**
   * Get current usage for a user using the WhatsAppUsage table
   */
  private static async getCurrentUsage(userId: string): Promise<WhatsAppUsage> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    // Get today's usage
    const todayUsage = await prisma.whatsAppUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      }
    })

    // Get monthly usage by summing all days in current month
    const monthlyUsage = await prisma.whatsAppUsage.aggregate({
      where: {
        userId,
        date: {
          gte: currentMonth
        }
      },
      _sum: {
        messagesCount: true,
        documentsCount: true
      }
    })

    // Check rate limiting
    const now = new Date()
    const currentHour = new Date()
    currentHour.setMinutes(0, 0, 0)
    const currentMinute = new Date()
    currentMinute.setSeconds(0, 0)

    const hourlyRateLimit = await prisma.whatsAppRateLimit.findUnique({
      where: {
        userId_windowType_windowStart: {
          userId,
          windowType: 'hour',
          windowStart: currentHour
        }
      }
    })

    const minuteRateLimit = await prisma.whatsAppRateLimit.findUnique({
      where: {
        userId_windowType_windowStart: {
          userId,
          windowType: 'minute',
          windowStart: currentMinute
        }
      }
    })

    return {
      dailyMessages: todayUsage?.messagesCount || 0,
      monthlyMessages: monthlyUsage._sum.messagesCount || 0,
      dailyDocuments: todayUsage?.documentsCount || 0,
      monthlyDocuments: monthlyUsage._sum.documentsCount || 0,
      lastMessageTime: todayUsage?.lastActivityAt,
      messagesThisMinute: minuteRateLimit?.requestCount || 0,
      messagesThisHour: hourlyRateLimit?.requestCount || 0
    }
  }

  /**
   * Get user's current usage and limits for display
   */
  static async getUserLimitsInfo(userId: string): Promise<{
    plan: string
    limits: {
      dailyMessages: number
      monthlyMessages: number
      dailyDocuments: number
      monthlyDocuments: number
    }
    usage: WhatsAppUsage
    remaining: {
      dailyMessages: number
      monthlyMessages: number
      dailyDocuments: number
      monthlyDocuments: number
    }
  } | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user?.subscription) return null

    const limits = this.getLimitsForPlan(user.subscription.plan, user.subscription.status)
    const usage = await this.getCurrentUsage(userId)

    return {
      plan: user.subscription.status === 'TRIAL' ? 'TRIAL' : user.subscription.plan,
      limits,
      usage,
      remaining: {
        dailyMessages: Math.max(0, limits.dailyMessages - usage.dailyMessages),
        monthlyMessages: Math.max(0, limits.monthlyMessages - usage.monthlyMessages),
        dailyDocuments: Math.max(0, limits.documentsPerDay - usage.dailyDocuments),
        monthlyDocuments: Math.max(0, limits.documentsPerMonth - usage.monthlyDocuments)
      }
    }
  }
}