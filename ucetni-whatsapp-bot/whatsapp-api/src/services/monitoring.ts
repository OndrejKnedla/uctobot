import { PrismaClient } from '@prisma/client';
import redisClient from '../utils/redis';
import logger from '../utils/logger';
import { config } from '../config';
import { SystemAlert, UserStats } from '../types';

const prisma = new PrismaClient();

export class MonitoringService {
  
  async getSystemStats(): Promise<{
    freeTrierUsage: {
      used: number;
      remaining: number;
      percentUsed: number;
      estimatedDaysRemaining: number;
    };
    userStats: {
      total: number;
      active: number;
      new: number;
      banned: number;
      byTrustLevel: Record<string, number>;
    };
    weeklyUsage: {
      averagePerUser: number;
      topUsers: Array<{ phoneNumber: string; count: number; trustLevel: string }>;
      distribution: Record<string, number>;
    };
    alerts: SystemAlert[];
  }> {
    const today = new Date();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get message counts
    const [monthMessages, totalUsers, activeUsers, newUsers, bannedUsers] = await Promise.all([
      prisma.message.count({
        where: {
          createdAt: { gte: monthStart }
        }
      }),
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastMessageAt: { gte: weekAgo }
        }
      }),
      prisma.user.count({
        where: {
          firstSeen: { gte: weekAgo }
        }
      }),
      prisma.user.count({
        where: {
          isBanned: true
        }
      })
    ]);
    
    // Trust level distribution
    const trustLevelCounts = await prisma.user.groupBy({
      by: ['trustLevel'],
      _count: true
    });
    
    const byTrustLevel = trustLevelCounts.reduce((acc, item) => {
      acc[item.trustLevel] = item._count;
      return acc;
    }, {} as Record<string, number>);
    
    // Weekly usage stats
    const weeklyUsage = await this.getWeeklyUsageStats();
    
    // Calculate free tier usage
    const freeTrierRemaining = Math.max(0, config.monitoring.freetierLimit - monthMessages);
    const percentUsed = (monthMessages / config.monitoring.freetierLimit) * 100;
    const estimatedDaysRemaining = this.calculateBurnRate(monthMessages);
    
    // Generate alerts
    const alerts = await this.checkAlerts();
    
    return {
      freeTrierUsage: {
        used: monthMessages,
        remaining: freeTrierRemaining,
        percentUsed: Math.round(percentUsed * 100) / 100,
        estimatedDaysRemaining
      },
      userStats: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        banned: bannedUsers,
        byTrustLevel
      },
      weeklyUsage,
      alerts
    };
  }
  
  async getUserStats(phoneNumber: string): Promise<UserStats | null> {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      include: {
        rateLimits: true,
        violations: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
    
    if (!user) return null;
    
    const usage = await redisClient.getUsageCounters(phoneNumber);
    
    // Get user's trust level limits
    const { TRUST_LIMITS, TrustLevel } = await import('../types');
    const trustLevel = user.trustLevel as keyof typeof TrustLevel;
    const limits = TRUST_LIMITS[TrustLevel[trustLevel]];
    
    return {
      phoneNumber,
      trustLevel: user.trustLevel as any,
      messagesThisWeek: usage.weekly,
      messagesThisDay: usage.daily,
      messagesThisHour: usage.hourly,
      weeklyLimit: limits.weeklyMax,
      dailyLimit: limits.dailyMax,
      isBanned: user.isBanned,
      banExpiresAt: user.banExpiresAt
    };
  }
  
  async checkRateLimitStatus(phoneNumber: string): Promise<{
    status: 'OK' | 'WARNING' | 'LIMIT_REACHED';
    message: string;
    limits: any;
    usage: any;
  }> {
    const usage = await redisClient.getUsageCounters(phoneNumber);
    const user = await prisma.user.findUnique({ where: { phoneNumber } });
    
    if (!user) {
      return {
        status: 'OK',
        message: 'User not found',
        limits: {},
        usage: {}
      };
    }
    
    const { TRUST_LIMITS, TrustLevel } = await import('../types');
    const trustLevel = user.trustLevel as keyof typeof TrustLevel;
    const limits = TRUST_LIMITS[TrustLevel[trustLevel]];
    
    // Check limits
    const weeklyPercentUsed = (usage.weekly / limits.weeklyMax) * 100;
    const dailyPercentUsed = (usage.daily / limits.dailyMax) * 100;
    
    if (usage.weekly >= limits.weeklyMax) {
      return {
        status: 'LIMIT_REACHED',
        message: 'Weekly limit reached',
        limits,
        usage
      };
    }
    
    if (weeklyPercentUsed >= 90 || dailyPercentUsed >= 90) {
      return {
        status: 'WARNING',
        message: 'Approaching limits',
        limits,
        usage
      };
    }
    
    return {
      status: 'OK',
      message: 'Within limits',
      limits,
      usage
    };
  }
  
  private async getWeeklyUsageStats(): Promise<{
    averagePerUser: number;
    topUsers: Array<{ phoneNumber: string; count: number; trustLevel: string }>;
    distribution: Record<string, number>;
  }> {
    const weekStart = this.getWeekStart(new Date());
    
    // Get messages from this week
    const weeklyMessages = await prisma.message.findMany({
      where: {
        createdAt: { gte: weekStart }
      },
      include: {
        user: {
          select: {
            phoneNumber: true,
            trustLevel: true
          }
        }
      }
    });
    
    // Group by user
    const userCounts: Record<string, { count: number; trustLevel: string }> = {};
    
    weeklyMessages.forEach(message => {
      const phone = message.user.phoneNumber;
      if (!userCounts[phone]) {
        userCounts[phone] = {
          count: 0,
          trustLevel: message.user.trustLevel
        };
      }
      userCounts[phone].count++;
    });
    
    const userEntries = Object.entries(userCounts);
    const totalUsers = userEntries.length;
    const totalMessages = weeklyMessages.length;
    const averagePerUser = totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0;
    
    // Top 10 users
    const topUsers = userEntries
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([phoneNumber, data]) => ({
        phoneNumber: phoneNumber.replace(/^(\+\d{3})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4'), // Format phone
        count: data.count,
        trustLevel: data.trustLevel
      }));
    
    // Distribution by message count ranges
    const distribution: Record<string, number> = {
      '0': 0,
      '1-5': 0,
      '6-10': 0,
      '11-20': 0,
      '21-40': 0,
      '40+': 0
    };
    
    userEntries.forEach(([, data]) => {
      const count = data.count;
      if (count === 0) distribution['0']++;
      else if (count <= 5) distribution['1-5']++;
      else if (count <= 10) distribution['6-10']++;
      else if (count <= 20) distribution['11-20']++;
      else if (count <= 40) distribution['21-40']++;
      else distribution['40+']++;
    });
    
    return {
      averagePerUser,
      topUsers,
      distribution
    };
  }
  
  private calculateBurnRate(monthMessages: number): number {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysIntoMonth = Math.floor((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    if (daysIntoMonth === 0) return daysInMonth;
    
    const dailyAverage = monthMessages / daysIntoMonth;
    const remainingMessages = config.monitoring.freetierLimit - monthMessages;
    const estimatedDaysRemaining = Math.floor(remainingMessages / Math.max(dailyAverage, 1));
    
    return Math.min(estimatedDaysRemaining, daysInMonth - daysIntoMonth);
  }
  
  async checkAlerts(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];
    const stats = await this.getSystemStats();
    
    // Free tier usage alerts
    const percentUsed = stats.freeTrierUsage.percentUsed;
    
    if (percentUsed >= config.monitoring.criticalThresholdPercent) {
      alerts.push({
        level: 'CRITICAL',
        message: `Free tier usage at ${percentUsed.toFixed(1)}%! Switch to Phase 2 (Hetzner) IMMEDIATELY!`,
        details: {
          used: stats.freeTrierUsage.used,
          remaining: stats.freeTrierUsage.remaining,
          estimatedDaysRemaining: stats.freeTrierUsage.estimatedDaysRemaining
        },
        timestamp: new Date()
      });
    } else if (percentUsed >= config.monitoring.alertThresholdPercent) {
      alerts.push({
        level: 'WARNING',
        message: `Free tier usage at ${percentUsed.toFixed(1)}%. Plan Phase 2 migration soon.`,
        details: {
          used: stats.freeTrierUsage.used,
          remaining: stats.freeTrierUsage.remaining,
          estimatedDaysRemaining: stats.freeTrierUsage.estimatedDaysRemaining
        },
        timestamp: new Date()
      });
    }
    
    // Low days remaining alert
    if (stats.freeTrierUsage.estimatedDaysRemaining <= 3) {
      alerts.push({
        level: 'CRITICAL',
        message: `Only ${stats.freeTrierUsage.estimatedDaysRemaining} days of messages remaining at current rate!`,
        details: stats.freeTrierUsage,
        timestamp: new Date()
      });
    } else if (stats.freeTrierUsage.estimatedDaysRemaining <= 7) {
      alerts.push({
        level: 'WARNING',
        message: `${stats.freeTrierUsage.estimatedDaysRemaining} days of messages remaining at current rate`,
        details: stats.freeTrierUsage,
        timestamp: new Date()
      });
    }
    
    // High spam/ban rate alerts
    if (stats.userStats.banned > 0 && stats.userStats.banned / stats.userStats.total > 0.1) {
      alerts.push({
        level: 'WARNING',
        message: `High ban rate: ${stats.userStats.banned} of ${stats.userStats.total} users (${((stats.userStats.banned / stats.userStats.total) * 100).toFixed(1)}%)`,
        details: {
          bannedUsers: stats.userStats.banned,
          totalUsers: stats.userStats.total
        },
        timestamp: new Date()
      });
    }
    
    // Unusual usage patterns
    if (stats.weeklyUsage.averagePerUser > 30) {
      alerts.push({
        level: 'INFO',
        message: `High average usage: ${stats.weeklyUsage.averagePerUser} messages per user this week`,
        details: stats.weeklyUsage,
        timestamp: new Date()
      });
    }
    
    return alerts;
  }
  
  async generateDailyReport(): Promise<{
    date: Date;
    summary: string;
    stats: any;
    alerts: SystemAlert[];
  }> {
    const stats = await this.getSystemStats();
    const alerts = stats.alerts;
    
    const summary = `
📊 **Daily Report - ${new Date().toLocaleDateString('cs-CZ')}**

🔢 **Free Tier Usage:** ${stats.freeTrierUsage.used}/1000 (${stats.freeTrierUsage.percentUsed.toFixed(1)}%)
📅 **Estimated Days Remaining:** ${stats.freeTrierUsage.estimatedDaysRemaining}

👥 **Users:**
• Total: ${stats.userStats.total}
• Active (7 days): ${stats.userStats.active}
• New (7 days): ${stats.userStats.new}
• Banned: ${stats.userStats.banned}

📈 **Usage:**
• Average per user: ${stats.weeklyUsage.averagePerUser} messages/week
• Top user: ${stats.weeklyUsage.topUsers[0]?.count || 0} messages

🚨 **Alerts:** ${alerts.length}
    `.trim();
    
    // Store in database
    await prisma.systemStats.upsert({
      where: {
        date: new Date(new Date().toDateString()) // Today's date only
      },
      update: {
        totalUsers: stats.userStats.total,
        activeUsers: stats.userStats.active,
        newUsers: stats.userStats.new,
        bannedUsers: stats.userStats.banned,
        totalMessages: stats.freeTrierUsage.used,
        monthlyMessageCount: stats.freeTrierUsage.used,
        freeTrierRemaining: stats.freeTrierUsage.remaining,
        newUserCount: stats.userStats.byTrustLevel['NEW_USER'] || 0,
        regularUserCount: stats.userStats.byTrustLevel['REGULAR'] || 0,
        verifiedUserCount: stats.userStats.byTrustLevel['VERIFIED'] || 0,
        premiumUserCount: stats.userStats.byTrustLevel['PREMIUM'] || 0,
      },
      create: {
        date: new Date(new Date().toDateString()),
        totalUsers: stats.userStats.total,
        activeUsers: stats.userStats.active,
        newUsers: stats.userStats.new,
        bannedUsers: stats.userStats.banned,
        totalMessages: stats.freeTrierUsage.used,
        monthlyMessageCount: stats.freeTrierUsage.used,
        freeTrierRemaining: stats.freeTrierUsage.remaining,
        newUserCount: stats.userStats.byTrustLevel['NEW_USER'] || 0,
        regularUserCount: stats.userStats.byTrustLevel['REGULAR'] || 0,
        verifiedUserCount: stats.userStats.byTrustLevel['VERIFIED'] || 0,
        premiumUserCount: stats.userStats.byTrustLevel['PREMIUM'] || 0,
      }
    });
    
    logger.info('Daily report generated', { messagesSent: stats.freeTrierUsage.used, alerts: alerts.length });
    
    return {
      date: new Date(),
      summary,
      stats,
      alerts
    };
  }
  
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  // Admin methods
  async sendAdminAlert(message: string, level: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO'): Promise<void> {
    logger.warn(`ADMIN ALERT [${level}]: ${message}`);
    
    // In production, you might want to send this via email, Slack, etc.
    // For now, we just log it with high visibility
    
    if (level === 'CRITICAL') {
      // Could integrate with external alerting service
      console.log('🚨 CRITICAL ALERT 🚨');
      console.log(message);
    }
  }
  
  async exportUserData(): Promise<{
    users: any[];
    totalCount: number;
  }> {
    const users = await prisma.user.findMany({
      include: {
        rateLimits: true,
        messages: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        violations: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    return {
      users: users.map(user => ({
        ...user,
        phoneNumber: user.phoneNumber.replace(/^(\+\d{3})(\d{3})(\d{3})(\d{3})$/, '$1 *** *** $4'), // Anonymize
        messagesThisWeek: 0, // Would need to calculate from Redis
      })),
      totalCount: users.length
    };
  }
}

export default new MonitoringService();