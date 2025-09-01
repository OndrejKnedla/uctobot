import { prisma } from '@/lib/db/prisma'
// Note: You'll need to install these packages:
// npm install chart.js chartjs-node-canvas date-fns

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string | string[]
    borderColor?: string
    borderWidth?: number
  }[]
}

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut'
  data: ChartData
  options: any
}

export class ChartGenerationService {
  
  /**
   * Generate monthly P&L chart
   */
  static async generateMonthlyPLChart(userId: string, year: number = new Date().getFullYear()): Promise<Buffer> {
    const monthlyData = await this.getMonthlyData(userId, year)
    
    const config: ChartConfig = {
      type: 'bar',
      data: {
        labels: monthlyData.map(m => m.month),
        datasets: [
          {
            label: 'Příjmy',
            data: monthlyData.map(m => m.income),
            backgroundColor: '#10B981',
            borderColor: '#059669',
            borderWidth: 1
          },
          {
            label: 'Výdaje',
            data: monthlyData.map(m => m.expenses),
            backgroundColor: '#EF4444',
            borderColor: '#DC2626',
            borderWidth: 1
          },
          {
            label: 'Zisk',
            data: monthlyData.map(m => m.profit),
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Měsíční přehled ${year}`,
            font: { size: 16 }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return value.toLocaleString('cs-CZ') + ' Kč'
              }
            }
          }
        }
      }
    }

    return this.generateChartImage(config, 800, 600)
  }

  /**
   * Generate cash flow chart
   */
  static async generateCashFlowChart(userId: string, days: number = 30): Promise<Buffer> {
    const dailyData = await this.getDailyData(userId, days)
    
    const config: ChartConfig = {
      type: 'line',
      data: {
        labels: dailyData.map(d => d.date),
        datasets: [
          {
            label: 'Kumulativní cash flow',
            data: dailyData.map(d => d.cumulativeCashFlow),
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3B82F6',
            borderWidth: 2
          },
          {
            label: 'Denní zisk',
            data: dailyData.map(d => d.dailyProfit),
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: '#10B981',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Cash Flow - posledních ${days} dní`,
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value: any) {
                return value.toLocaleString('cs-CZ') + ' Kč'
              }
            }
          }
        }
      }
    }

    return this.generateChartImage(config, 800, 400)
  }

  /**
   * Generate expense breakdown pie chart
   */
  static async generateExpenseBreakdownChart(userId: string, period: 'month' | 'quarter' | 'year' = 'month'): Promise<Buffer> {
    const expenseData = await this.getExpenseByCategory(userId, period)
    
    const colors = [
      '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6',
      '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'
    ]
    
    const config: ChartConfig = {
      type: 'doughnut',
      data: {
        labels: expenseData.map(e => e.category),
        datasets: [{
          label: 'Výdaje podle kategorií',
          data: expenseData.map(e => e.amount),
          backgroundColor: colors.slice(0, expenseData.length),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Výdaje podle kategorií - ${this.getPeriodLabel(period)}`,
            font: { size: 16 }
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    }

    return this.generateChartImage(config, 600, 600)
  }

  /**
   * Generate tax overview chart
   */
  static async generateTaxOverviewChart(userId: string, year: number = new Date().getFullYear()): Promise<Buffer> {
    const taxData = await this.getTaxData(userId, year)
    
    const config: ChartConfig = {
      type: 'bar',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
          {
            label: 'DPH k odvodu',
            data: taxData.map(q => q.vatOwed),
            backgroundColor: '#DC2626'
          },
          {
            label: 'Zálohy na daň z příjmu',
            data: taxData.map(q => q.incomeTaxAdvance),
            backgroundColor: '#7C3AED'
          },
          {
            label: 'Sociální pojištění',
            data: taxData.map(q => q.socialInsurance),
            backgroundColor: '#0891B2'
          },
          {
            label: 'Zdravotní pojištění',
            data: taxData.map(q => q.healthInsurance),
            backgroundColor: '#059669'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Daňové povinnosti ${year}`,
            font: { size: 16 }
          }
        },
        scales: {
          x: {
            stacked: false
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return value.toLocaleString('cs-CZ') + ' Kč'
              }
            }
          }
        }
      }
    }

    return this.generateChartImage(config, 800, 500)
  }

  /**
   * Generate chart image using Chart.js
   */
  private static async generateChartImage(config: ChartConfig, width: number = 800, height: number = 600): Promise<Buffer> {
    // TODO: Implement actual chart generation with chartjs-node-canvas
    // For now, return a placeholder
    
    /*
    const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
    
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
      width, 
      height,
      backgroundColour: 'white',
      chartCallback: (ChartJS: any) => {
        ChartJS.defaults.font.family = 'Arial, sans-serif';
      }
    });

    const buffer = await chartJSNodeCanvas.renderToBuffer(config);
    return buffer;
    */
    
    // Placeholder - return empty buffer
    console.log('📊 Chart generated (mock):', config.options?.plugins?.title?.text)
    return Buffer.from(`Mock chart: ${config.options?.plugins?.title?.text}`)
  }

  /**
   * Get monthly financial data
   */
  private static async getMonthlyData(userId: string, year: number) {
    const months = []
    
    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)
      
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          transactionDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })
      
      const income = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      const expenses = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      months.push({
        month: startDate.toLocaleDateString('cs-CZ', { month: 'short' }),
        income,
        expenses,
        profit: income - expenses
      })
    }
    
    return months
  }

  /**
   * Get daily financial data for cash flow
   */
  private static async getDailyData(userId: string, days: number) {
    const dailyData = []
    let cumulativeCashFlow = 0
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          transactionDate: {
            gte: date,
            lt: nextDate
          }
        }
      })
      
      const income = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      const expenses = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      const dailyProfit = income - expenses
      cumulativeCashFlow += dailyProfit
      
      dailyData.push({
        date: date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' }),
        income,
        expenses,
        dailyProfit,
        cumulativeCashFlow
      })
    }
    
    return dailyData
  }

  /**
   * Get expenses grouped by category
   */
  private static async getExpenseByCategory(userId: string, period: 'month' | 'quarter' | 'year') {
    const startDate = this.getPeriodStartDate(period)
    const endDate = new Date()
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    
    const categoryTotals: { [key: string]: number } = {}
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Ostatní'
      categoryTotals[category] = (categoryTotals[category] || 0) + Number(transaction.amount)
    })
    
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10) // Top 10 categories
  }

  /**
   * Get quarterly tax data
   */
  private static async getTaxData(userId: string, year: number) {
    const quarters = []
    
    for (let quarter = 0; quarter < 4; quarter++) {
      const startMonth = quarter * 3
      const startDate = new Date(year, startMonth, 1)
      const endDate = new Date(year, startMonth + 3, 0)
      
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          transactionDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })
      
      const income = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      const expenses = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      // Simplified tax calculations
      const profit = Math.max(0, income - expenses)
      
      quarters.push({
        quarter: `Q${quarter + 1}`,
        vatOwed: Math.max(0, income * 0.21 - expenses * 0.21),
        incomeTaxAdvance: profit * 0.15,
        socialInsurance: Math.max(0, income * 0.292),
        healthInsurance: Math.max(0, income * 0.135)
      })
    }
    
    return quarters
  }

  /**
   * Helper methods
   */
  private static getPeriodStartDate(period: 'month' | 'quarter' | 'year'): Date {
    const now = new Date()
    
    switch (period) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        return new Date(now.getFullYear(), currentQuarter * 3, 1)
      case 'year':
        return new Date(now.getFullYear(), 0, 1)
    }
  }

  private static getPeriodLabel(period: 'month' | 'quarter' | 'year'): string {
    const now = new Date()
    
    switch (period) {
      case 'month':
        return now.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3) + 1
        return `Q${quarter} ${now.getFullYear()}`
      case 'year':
        return now.getFullYear().toString()
    }
  }

  /**
   * Save chart to database and return URL
   */
  static async saveChartToDatabase(userId: string, chartType: any, period: string, imageBuffer: Buffer): Promise<string> {
    // TODO: Upload image to cloud storage (Cloudinary, AWS S3, etc.)
    const imageUrl = `https://placeholder.com/chart-${Date.now()}.png`
    
    await prisma.chartGeneration.create({
      data: {
        userId,
        chartType,
        period,
        data: {},
        imageUrl,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })
    
    return imageUrl
  }
}

export default ChartGenerationService