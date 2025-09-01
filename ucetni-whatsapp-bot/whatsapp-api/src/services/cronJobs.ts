import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import redisClient from '../utils/redis';
import logger from '../utils/logger';
import monitoringService from './monitoring';
import antiSpamMiddleware from '../middleware/antiSpam';
import { config } from '../config';

const prisma = new PrismaClient();

export class CronJobService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  
  async startAllJobs(): Promise<void> {
    logger.info('Starting CRON jobs...');
    
    // Weekly reset - každé pondělí 00:00 UTC
    this.scheduleJob('weekly-reset', '0 0 * * 1', async () => {
      await this.weeklyReset();
    });
    
    // Daily tasks - každý den 00:00 UTC  
    this.scheduleJob('daily-tasks', '0 0 * * *', async () => {
      await this.dailyTasks();
    });
    
    // Hourly checks - každou hodinu v :00
    this.scheduleJob('hourly-checks', '0 * * * *', async () => {
      await this.hourlyChecks();
    });
    
    // Clean expired bans - každých 15 minut
    this.scheduleJob('clean-bans', '*/15 * * * *', async () => {
      await this.cleanExpiredBans();
    });
    
    // Update trust levels - každé 4 hodiny
    this.scheduleJob('trust-levels', '0 */4 * * *', async () => {
      await this.updateAllTrustLevels();
    });
    
    // Cleanup old data - každý den ve 2:00 UTC
    this.scheduleJob('cleanup', '0 2 * * *', async () => {
      await this.cleanupOldData();
    });
    
    logger.info(`Started ${this.jobs.size} CRON jobs`);
  }
  
  private scheduleJob(name: string, schedule: string, task: () => Promise<void>): void {
    const job = cron.schedule(schedule, async () => {
      const startTime = Date.now();
      logger.info(`Starting CRON job: ${name}`);
      
      try {
        await task();
        const duration = Date.now() - startTime;
        logger.info(`CRON job completed: ${name} (${duration}ms)`);
      } catch (error) {
        logger.error(`CRON job failed: ${name}`, error);
        await monitoringService.sendAdminAlert(`CRON job failed: ${name} - ${error}`, 'WARNING');
      }
    }, {
      scheduled: false,
      timezone: "UTC"
    });
    
    this.jobs.set(name, job);
    job.start();
  }
  
  // Weekly reset - clear all rate limit counters
  private async weeklyReset(): Promise<void> {
    logger.info('Starting weekly reset...');
    
    try {
      // Reset Redis counters
      const deletedKeys = await redisClient.resetWeeklyLimits();
      
      // Reset database rate limits
      await prisma.rateLimit.updateMany({
        data: {
          weekCount: 0,
          weekStartedAt: new Date(),
          lastResetAt: new Date()
        }
      });
      
      // Get stats for reporting
      const userCount = await prisma.user.count();
      
      logger.info(`Weekly reset completed: ${deletedKeys} Redis keys deleted, ${userCount} users reset`);
      
      // Send admin notification
      await monitoringService.sendAdminAlert(
        `Weekly rate limits reset: ${userCount} users, ${deletedKeys} Redis keys cleared`,
        'INFO'
      );
    } catch (error) {
      logger.error('Weekly reset failed:', error);
      throw error;
    }
  }
  
  // Daily maintenance tasks
  private async dailyTasks(): Promise<void> {
    logger.info('Starting daily tasks...');
    
    try {
      // Generate daily report
      const report = await monitoringService.generateDailyReport();
      
      // Check for users to upgrade trust level
      await this.checkTrustLevelUpgrades();
      
      // Clean old webhook logs (keep 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const deletedWebhooks = await prisma.webhookLog.deleteMany({
        where: {
          createdAt: { lt: weekAgo }
        }
      });
      
      // Clean old system stats (keep 30 days)
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deletedStats = await prisma.systemStats.deleteMany({
        where: {
          createdAt: { lt: monthAgo }
        }
      });
      
      logger.info(`Daily tasks completed: ${deletedWebhooks.count} webhooks, ${deletedStats.count} stats cleaned`);
      
      // Send critical alerts if needed
      for (const alert of report.alerts) {
        if (alert.level === 'CRITICAL') {
          await monitoringService.sendAdminAlert(alert.message, 'CRITICAL');
        }
      }
    } catch (error) {
      logger.error('Daily tasks failed:', error);
      throw error;
    }
  }
  
  // Hourly monitoring checks
  private async hourlyChecks(): Promise<void> {
    try {
      const stats = await monitoringService.getSystemStats();
      
      // Check free tier usage
      if (stats.freeTrierUsage.percentUsed >= config.monitoring.criticalThresholdPercent) {
        await monitoringService.sendAdminAlert(
          `URGENT: Free tier at ${stats.freeTrierUsage.percentUsed.toFixed(1)}%! Switch to Phase 2 NOW!`,
          'CRITICAL'
        );
      } else if (stats.freeTrierUsage.percentUsed >= config.monitoring.alertThresholdPercent) {
        await monitoringService.sendAdminAlert(
          `Warning: Free tier at ${stats.freeTrierUsage.percentUsed.toFixed(1)}%`,
          'WARNING'
        );
      }
      
      // Check for system health issues
      const redisHealth = await this.checkRedisHealth();
      const dbHealth = await this.checkDatabaseHealth();
      
      if (!redisHealth || !dbHealth) {
        await monitoringService.sendAdminAlert(
          `System health check failed: Redis=${redisHealth}, DB=${dbHealth}`,
          'CRITICAL'
        );
      }
      
      logger.debug('Hourly checks completed', {
        freeTrierPercent: stats.freeTrierUsage.percentUsed,
        redisHealth,
        dbHealth
      });
    } catch (error) {
      logger.error('Hourly checks failed:', error);
      // Don't throw - these are non-critical monitoring tasks
    }
  }
  
  // Clean expired bans
  private async cleanExpiredBans(): Promise<void> {
    try {
      const now = new Date();
      
      // Find and unban expired users
      const expiredBans = await prisma.user.findMany({
        where: {
          isBanned: true,
          banExpiresAt: {
            lt: now
          }
        }
      });
      
      // Unban in database
      if (expiredBans.length > 0) {
        await prisma.user.updateMany({
          where: {
            id: {
              in: expiredBans.map(u => u.id)
            }
          },
          data: {
            isBanned: false,
            banExpiresAt: null,
            banReason: null
          }
        });
        
        // Remove from Redis
        for (const user of expiredBans) {
          await redisClient.removeBan(user.phoneNumber);
        }
        
        logger.info(`Unbanned ${expiredBans.length} expired users`);
      }
    } catch (error) {
      logger.error('Failed to clean expired bans:', error);
    }
  }
  
  // Update trust levels for eligible users
  private async updateAllTrustLevels(): Promise<void> {
    try {
      // Find users who might be eligible for upgrade
      const eligibleUsers = await prisma.user.findMany({
        where: {
          OR: [
            {
              // NEW_USER -> REGULAR after 7 days
              trustLevel: 'NEW_USER',
              firstSeen: {
                lt: new Date(Date.now() - config.business.trustLevelUpgradedays * 24 * 60 * 60 * 1000)
              }
            },
            {
              // Users with ICO that might need verification
              trustLevel: {
                in: ['NEW_USER', 'REGULAR']
              },
              ico: {
                not: null
              }
            }
          ]
        }
      });
      
      let upgraded = 0;
      for (const user of eligibleUsers) {
        try {
          const oldLevel = user.trustLevel;
          await antiSpamMiddleware.updateTrustLevel(user.phoneNumber);
          
          // Check if level actually changed
          const updatedUser = await prisma.user.findUnique({
            where: { id: user.id }
          });
          
          if (updatedUser && updatedUser.trustLevel !== oldLevel) {
            upgraded++;
            logger.info(`User ${user.phoneNumber} upgraded: ${oldLevel} -> ${updatedUser.trustLevel}`);
          }
        } catch (error) {
          logger.error(`Failed to update trust level for ${user.phoneNumber}:`, error);
        }
      }
      
      if (upgraded > 0) {
        logger.info(`Trust level update completed: ${upgraded} users upgraded`);
      }
    } catch (error) {
      logger.error('Trust level update failed:', error);
    }
  }
  
  // Check users eligible for trust level upgrade
  private async checkTrustLevelUpgrades(): Promise<void> {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const eligibleUsers = await prisma.user.count({
        where: {
          trustLevel: 'NEW_USER',
          firstSeen: { lt: weekAgo }
        }
      });
      
      if (eligibleUsers > 0) {
        logger.info(`${eligibleUsers} users eligible for trust level upgrade`);
      }
    } catch (error) {
      logger.error('Trust level upgrade check failed:', error);
    }
  }
  
  // Cleanup old data
  private async cleanupOldData(): Promise<void> {
    logger.info('Starting data cleanup...');
    
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      // Delete old messages (keep 30 days)
      const deletedMessages = await prisma.message.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          status: { in: ['PROCESSED', 'FAILED', 'SPAM'] }
        }
      });
      
      // Delete very old spam violations (keep 90 days)
      const deletedViolations = await prisma.spamViolation.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo }
        }
      });
      
      // Clean up inactive users with no messages (90+ days old)
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          firstSeen: { lt: ninetyDaysAgo },
          lastMessageAt: null,
          totalMessageCount: 0
        }
      });
      
      logger.info(`Data cleanup completed: ${deletedMessages.count} messages, ${deletedViolations.count} violations, ${deletedUsers.count} inactive users deleted`);
    } catch (error) {
      logger.error('Data cleanup failed:', error);
      throw error;
    }
  }
  
  // Health check methods
  private async checkRedisHealth(): Promise<boolean> {
    try {
      await redisClient.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }
  
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
  
  // Manual trigger methods (for testing/admin use)
  async triggerWeeklyReset(): Promise<void> {
    logger.info('Manually triggering weekly reset...');
    await this.weeklyReset();
  }
  
  async triggerDailyTasks(): Promise<void> {
    logger.info('Manually triggering daily tasks...');
    await this.dailyTasks();
  }
  
  // Stop all jobs
  stopAllJobs(): void {
    logger.info('Stopping all CRON jobs...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      job.destroy();
      logger.debug(`Stopped CRON job: ${name}`);
    });
    
    this.jobs.clear();
    logger.info('All CRON jobs stopped');
  }
  
  // Get job status
  getJobStatus(): Array<{ name: string; running: boolean; nextRun?: Date }> {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      running: job.running,
      // Note: node-cron doesn't expose next run time easily
    }));
  }
}

export default new CronJobService();