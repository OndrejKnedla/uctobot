import { prisma } from '@/lib/db/prisma'
import { sendWhatsAppMessage } from '@/lib/services/whatsapp'

interface DayStats {
  totalIncome: number
  totalExpenses: number
  overdueInvoices: number
  pendingTasks: number
  todayTransactions: number
  yesterdayProfit: number
}

export class DailyBriefingService {
  
  /**
   * Generate and send morning briefing to all active users
   */
  static async sendMorningBriefings() {
    const users = await prisma.user.findMany({
      where: {
        whatsappVerified: true,
        isProfileComplete: true,
        dailyBriefingEnabled: true,
        whatsappPhone: { not: null }
      }
    })

    const results = []
    
    for (const user of users) {
      try {
        await this.sendMorningBriefingToUser(user.id)
        results.push({ userId: user.id, success: true })
      } catch (error) {
        console.error(`Failed to send briefing to user ${user.id}:`, error)
        results.push({ userId: user.id, success: false, error })
      }
    }

    return results
  }

  /**
   * Generate and send morning briefing to specific user
   */
  static async sendMorningBriefingToUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        transactions: {
          where: {
            transactionDate: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        },
        invoices: {
          where: {
            status: 'OVERDUE'
          }
        }
      }
    })

    if (!user || !user.whatsappPhone) return

    const stats = await this.calculateDayStats(userId)
    const insights = await this.generateAIInsights(userId, stats)
    
    // Save briefing to database
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const briefing = await prisma.dailyBriefing.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: {
        totalIncome: stats.totalIncome,
        totalExpenses: stats.totalExpenses,
        overdueInvoices: stats.overdueInvoices,
        pendingTasks: stats.pendingTasks,
        aiInsights: insights,
        sentAt: new Date()
      },
      create: {
        userId,
        date: today,
        totalIncome: stats.totalIncome,
        totalExpenses: stats.totalExpenses,
        overdueInvoices: stats.overdueInvoices,
        pendingTasks: stats.pendingTasks,
        aiInsights: insights,
        sentAt: new Date()
      }
    })

    const message = this.formatMorningBriefing(user, stats, insights)
    
    // Send WhatsApp message
    await sendWhatsAppMessage(user.whatsappPhone, message)

    // Update user streak
    await this.updateUserStreak(userId)

    return briefing
  }

  /**
   * Generate evening report with visual chart
   */
  static async sendEveningReport(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.whatsappPhone || !user.eveningReportEnabled) return

    const stats = await this.calculateDayStats(userId)
    
    // Generate chart image (will implement later)
    // const chartUrl = await this.generateDayChart(userId, stats)
    
    const message = this.formatEveningReport(user, stats)
    
    await sendWhatsAppMessage(user.whatsappPhone, message)
  }

  /**
   * Calculate daily statistics for user
   */
  private static async calculateDayStats(userId: string): Promise<DayStats> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Today's transactions
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    // Yesterday's transactions for comparison
    const yesterdayTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: yesterday,
          lt: today
        }
      }
    })

    // Overdue invoices
    const overdueInvoices = await prisma.invoice.count({
      where: {
        userId,
        status: 'OVERDUE',
        dueDate: { lt: new Date() }
      }
    })

    const totalIncome = todayTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenses = todayTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const yesterdayIncome = yesterdayTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const yesterdayExpenses = yesterdayTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      totalIncome,
      totalExpenses,
      overdueInvoices,
      pendingTasks: 0, // Will implement task system later
      todayTransactions: todayTransactions.length,
      yesterdayProfit: yesterdayIncome - yesterdayExpenses
    }
  }

  /**
   * Generate AI-powered insights (placeholder for now)
   */
  private static async generateAIInsights(userId: string, stats: DayStats) {
    // TODO: Implement OpenAI integration for insights
    const insights = []
    
    if (stats.overdueInvoices > 0) {
      insights.push(`Máte ${stats.overdueInvoices} fakturu po splatnosti`)
    }
    
    if (stats.totalIncome > stats.yesterdayProfit * 1.5) {
      insights.push("Skvělý den! Výrazně vyšší příjmy než včera")
    }
    
    if (stats.todayTransactions === 0) {
      insights.push("Zatím žádné transakce - nezapomeňte zaznamenat dnešní aktivitu")
    }

    return { insights, generatedAt: new Date() }
  }

  /**
   * Format morning briefing message
   */
  private static formatMorningBriefing(user: any, stats: DayStats, insights: any): string {
    const greeting = this.getTimeBasedGreeting()
    const name = user.firstName || 'podnikateli'
    
    return `${greeting} ${name}! 🌅

📊 **RANNÍ PŘEHLED** - ${new Date().toLocaleDateString('cs-CZ')}

💰 **VČEREJŠÍ BILANCE:**
• Příjmy: ${stats.totalIncome.toLocaleString('cs-CZ')} Kč
• Výdaje: ${stats.totalExpenses.toLocaleString('cs-CZ')} Kč
• Zisk: ${stats.yesterdayProfit.toLocaleString('cs-CZ')} Kč

${stats.overdueInvoices > 0 ? `⚠️ **UPOZORNĚNÍ:** ${stats.overdueInvoices} faktur po splatnosti!\n` : ''}

🎯 **DNEŠNÍ CÍLE:**
• Zaznamenat všechny transakce
• Zkontrolovat přijaté platby
• ${stats.overdueInvoices > 0 ? 'Vyřídit faktury po splatnosti' : 'Udržet pozitivní cash flow'}

🔥 **VAŠE SÉRIE:** ${user.currentStreak} dní v řadě!

💡 *Tip: Napište "přehled" pro aktuální stav financí*

Přeji produktivní den! 💪`
  }

  /**
   * Format evening report message
   */
  private static formatEveningReport(user: any, stats: DayStats): string {
    const profit = stats.totalIncome - stats.totalExpenses
    const profitEmoji = profit > 0 ? '📈' : profit < 0 ? '📉' : '⚖️'
    
    return `🌙 **VEČERNÍ REPORT** - ${new Date().toLocaleDateString('cs-CZ')}

${profitEmoji} **DNEŠNÍ VÝSLEDKY:**
• Příjmy: ${stats.totalIncome.toLocaleString('cs-CZ')} Kč
• Výdaje: ${stats.totalExpenses.toLocaleString('cs-CZ')} Kč
• Čistý zisk: ${profit.toLocaleString('cs-CZ')} Kč

📊 **POROVNÁNÍ S VČEREJŠKEM:**
${profit > stats.yesterdayProfit ? '⬆️ Lepší než včera!' : profit < stats.yesterdayProfit ? '⬇️ Horší než včera' : '➡️ Stejně jako včera'}

${stats.todayTransactions > 0 ? `✅ Zaznamenali jste ${stats.todayTransactions} transakcí` : '⚠️ Žádné transakce dnes'}

${profit > 1000 ? '🎉 Skvělý den! Pokračujte v dobré práci!' : 
  profit > 0 ? '👍 Solidní den, držíte se nad vodou!' : 
  '💪 Zítra bude lepší! Každý den je nová příležitost.'}

😴 Dobrou noc a odpočinek si zasloužíte!`
  }

  /**
   * Get time-based greeting
   */
  private static getTimeBasedGreeting(): string {
    const hour = new Date().getHours()
    
    if (hour < 6) return "Dobré ráno, ranní ptáče"
    if (hour < 10) return "Dobré ráno"
    if (hour < 12) return "Dobré dopoledne"
    if (hour < 18) return "Dobrý den"
    return "Dobrý večer"
  }

  /**
   * Update user engagement streak
   */
  private static async updateUserStreak(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) return

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const yesterdayBriefing = await prisma.dailyBriefing.findUnique({
      where: {
        userId_date: {
          userId,
          date: yesterday
        }
      }
    })

    let newStreak = 1
    if (yesterdayBriefing && yesterdayBriefing.opened) {
      newStreak = user.currentStreak + 1
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak)
      }
    })

    // Check for streak achievements
    await this.checkStreakAchievements(userId, newStreak)
  }

  /**
   * Check and award streak-based achievements
   */
  private static async checkStreakAchievements(userId: string, streak: number) {
    const milestones = [7, 14, 30, 60, 100, 365]
    
    for (const milestone of milestones) {
      if (streak === milestone) {
        await prisma.achievement.create({
          data: {
            userId,
            type: 'STREAK',
            title: `${milestone} dní v řadě!`,
            description: `Používáte ÚčtoBot ${milestone} dní po sobě`,
            badgeEmoji: milestone >= 365 ? '👑' : milestone >= 100 ? '🏆' : '🔥',
            points: milestone * 10,
            unlockedAt: new Date()
          }
        })
        
        // Send achievement notification
        const user = await prisma.user.findUnique({
          where: { id: userId }
        })
        
        if (user?.whatsappPhone) {
          const message = `🎉 **ACHIEVEMENT UNLOCKED!**

🔥 ${milestone} DNÍ V ŘADĚ!

Gratulujeme! Používáte ÚčtoBot každý den už ${milestone} dní po sobě. To je neuvěřitelná disciplína!

🏆 Odměna: +${milestone * 10} bodů
${milestone >= 365 ? '👑 Jste účetní LEGENDA!' : milestone >= 100 ? '🏆 Jste účetní MISTR!' : '🔥 Pokračujte v dobré práci!'}

Napište "achievementy" pro přehled všech úspěchů!`

          await sendWhatsAppMessage(user.whatsappPhone, message)
        }
      }
    }
  }
}

export default DailyBriefingService