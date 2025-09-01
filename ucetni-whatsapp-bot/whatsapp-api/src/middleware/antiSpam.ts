import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { PrismaClient, TrustLevel as PrismaTrustLevel } from '@prisma/client';
import redisClient from '../utils/redis';
import logger from '../utils/logger';
import { config } from '../config';
import { TrustLevel, TRUST_LIMITS, RateLimitCheckResult } from '../types';

const prisma = new PrismaClient();

export class AntiSpamMiddleware {
  async checkRateLimit(phoneNumber: string): Promise<RateLimitCheckResult> {
    try {
      // Check if banned
      const banStatus = await redisClient.checkBan(phoneNumber);
      if (banStatus.isBanned) {
        return {
          allowed: false,
          reason: 'BANNED',
          resetDate: banStatus.expiresAt,
          message: `Účet dočasně zablokován do ${banStatus.expiresAt?.toLocaleString('cs-CZ')}`
        };
      }
      
      // Get user and their trust level
      const user = await this.getOrCreateUser(phoneNumber);
      const trustLevel = user.trustLevel as TrustLevel;
      const limits = TRUST_LIMITS[trustLevel];
      
      // Get current usage from Redis
      const usage = await redisClient.getUsageCounters(phoneNumber);
      
      // Check weekly limit
      if (usage.weekly >= limits.weeklyMax) {
        const nextMonday = this.getNextMonday();
        return {
          allowed: false,
          reason: 'WEEKLY_LIMIT',
          resetDate: nextMonday,
          message: `📊 Týdenní limit ${limits.weeklyMax} zpráv vyčerpán. Reset ${nextMonday.toLocaleDateString('cs-CZ')}.`,
          currentUsage: usage,
          limits
        };
      }
      
      // Check daily burst protection
      if (usage.daily >= limits.dailyMax) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        return {
          allowed: false,
          reason: 'DAILY_BURST',
          resetDate: tomorrow,
          message: `⏸️ Denní maximum ${limits.dailyMax} zpráv dosaženo. Pokračuj zítra.`,
          currentUsage: usage,
          limits
        };
      }
      
      // Check hourly limit
      if (usage.hourly >= limits.hourlyMax) {
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        
        return {
          allowed: false,
          reason: 'HOURLY_LIMIT',
          resetDate: nextHour,
          message: `⏱️ Hodinový limit ${limits.hourlyMax} zpráv dosažen. Počkej hodinu.`,
          currentUsage: usage,
          limits
        };
      }
      
      // Check time between messages
      if (usage.lastMessageAt) {
        const secondsSinceLastMessage = Math.floor((Date.now() - usage.lastMessageAt.getTime()) / 1000);
        const minSeconds = limits.minSecondsBetweenMessages;
        
        if (secondsSinceLastMessage < minSeconds) {
          return {
            allowed: false,
            reason: 'TOO_FAST',
            waitSeconds: minSeconds - secondsSinceLastMessage,
            message: `⏱️ Příliš rychle! Počkej ještě ${minSeconds - secondsSinceLastMessage} sekund.`,
            currentUsage: usage,
            limits
          };
        }
      }
      
      return {
        allowed: true,
        currentUsage: usage,
        limits
      };
    } catch (error) {
      logger.error('Rate limit check failed:', error);
      // In case of error, allow the message but log it
      return { allowed: true };
    }
  }
  
  async detectSpamPatterns(message: string, phoneNumber: string): Promise<boolean> {
    try {
      const messageHash = this.hashMessage(message);
      
      // Check for duplicate messages
      const recentMessages = await redisClient.getRecentMessages(phoneNumber, 5);
      const duplicates = recentMessages.filter(m => m.hash === messageHash);
      
      if (duplicates.length >= config.antiSpam.maxIdenticalMessages) {
        await this.flagAsSpammer(phoneNumber, 'DUPLICATE', message);
        return true;
      }
      
      // Check for spam patterns
      for (const pattern of config.antiSpam.spamPatterns) {
        if (pattern.test(message)) {
          await this.flagAsSpammer(phoneNumber, 'PATTERN', message);
          return true;
        }
      }
      
      // Store the message for future duplicate detection
      await redisClient.addRecentMessage(phoneNumber, message, messageHash);
      
      return false;
    } catch (error) {
      logger.error('Spam detection failed:', error);
      return false;
    }
  }
  
  async flagAsSpammer(phoneNumber: string, violationType: string, content?: string): Promise<void> {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { phoneNumber },
        include: { violations: true }
      });
      
      if (!user) return;
      
      // Record violation
      await prisma.spamViolation.create({
        data: {
          userId: user.id,
          violationType,
          violationDetail: `Detected ${violationType.toLowerCase()} spam pattern`,
          messageContent: content,
          severity: violationType === 'DUPLICATE' ? 2 : 3,
          actionTaken: 'WARNING'
        }
      });
      
      // Check if we should ban
      const recentViolations = user.violations.filter(v => {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return v.createdAt > hourAgo;
      });
      
      if (recentViolations.length >= config.antiSpam.maxViolationsBeforeBan) {
        await this.banUser(phoneNumber, config.antiSpam.tempBanDurationHours);
      }
    } catch (error) {
      logger.error('Failed to flag spammer:', error);
    }
  }
  
  async banUser(phoneNumber: string, hours: number): Promise<void> {
    try {
      const banExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      
      // Update user in database
      await prisma.user.update({
        where: { phoneNumber },
        data: {
          isBanned: true,
          banExpiresAt,
          banReason: `Automatic ${hours}h ban for spam violations`
        }
      });
      
      // Set ban in Redis
      await redisClient.setBan(phoneNumber, hours);
      
      // Record violation
      const user = await prisma.user.findUnique({ where: { phoneNumber } });
      if (user) {
        await prisma.spamViolation.create({
          data: {
            userId: user.id,
            violationType: 'AUTO_BAN',
            violationDetail: `Banned for ${hours} hours due to repeated violations`,
            severity: 5,
            actionTaken: 'TEMP_BAN',
            banDuration: hours
          }
        });
      }
      
      logger.warn(`User ${phoneNumber} banned for ${hours} hours`);
    } catch (error) {
      logger.error('Failed to ban user:', error);
    }
  }
  
  async updateTrustLevel(phoneNumber: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { phoneNumber }
      });
      
      if (!user) return;
      
      const daysSinceRegistration = Math.floor(
        (Date.now() - user.firstSeen.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let newTrustLevel: PrismaTrustLevel = user.trustLevel;
      
      // Check for premium subscription
      if (user.subscriptionTier === 'PREMIUM' && user.subscriptionExpiresAt && user.subscriptionExpiresAt > new Date()) {
        newTrustLevel = 'PREMIUM' as PrismaTrustLevel;
      }
      // Check for verified ICO
      else if (user.ico && await this.verifyICO(user.ico)) {
        newTrustLevel = 'VERIFIED' as PrismaTrustLevel;
      }
      // Check for regular status
      else if (daysSinceRegistration >= config.business.trustLevelUpgradedays && user.trustLevel === 'NEW_USER') {
        newTrustLevel = 'REGULAR' as PrismaTrustLevel;
      }
      
      if (newTrustLevel !== user.trustLevel) {
        await prisma.user.update({
          where: { phoneNumber },
          data: {
            trustLevel: newTrustLevel,
            trustLevelUpdatedAt: new Date()
          }
        });
        
        logger.info(`User ${phoneNumber} trust level updated to ${newTrustLevel}`);
      }
    } catch (error) {
      logger.error('Failed to update trust level:', error);
    }
  }
  
  private async getOrCreateUser(phoneNumber: string) {
    let user = await prisma.user.findUnique({
      where: { phoneNumber }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber,
          trustLevel: 'NEW_USER' as PrismaTrustLevel,
          rateLimits: {
            create: {
              weekCount: 0,
              dayCount: 0,
              hourCount: 0,
              weekStartedAt: this.getWeekStart(new Date()),
              dayStartedAt: this.getDayStart(new Date()),
              hourStartedAt: this.getHourStart(new Date())
            }
          }
        }
      });
    }
    
    return user;
  }
  
  private async verifyICO(ico: string): Promise<boolean> {
    // Simplified ICO verification - in production, call real API
    // For Czech Republic: https://ares.gov.cz/
    if (config.nodeEnv === 'development') {
      return ico.length === 8 && /^\d+$/.test(ico);
    }
    
    try {
      // Real implementation would call ARES API
      // const response = await axios.get(`${config.business.icoVerificationUrl}${ico}`);
      // return response.data.pocetCelkem > 0;
      return true;
    } catch (error) {
      logger.error('ICO verification failed:', error);
      return false;
    }
  }
  
  private hashMessage(message: string): string {
    return crypto.createHash('sha256').update(message).digest('hex');
  }
  
  private getNextMonday(): Date {
    const d = new Date();
    const day = d.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + daysUntilMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  private getDayStart(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  private getHourStart(date: Date): Date {
    const d = new Date(date);
    d.setMinutes(0, 0, 0);
    return d;
  }
  
  // Express middleware function
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Skip rate limiting for webhook verification
      if (req.method === 'GET' && req.path === '/webhook') {
        return next();
      }
      
      // Extract phone number from request
      const phoneNumber = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
      
      if (!phoneNumber) {
        return next();
      }
      
      const rateLimitResult = await this.checkRateLimit(phoneNumber);
      
      if (!rateLimitResult.allowed) {
        logger.warn(`Rate limit exceeded for ${phoneNumber}: ${rateLimitResult.reason}`);
        
        // Store rate limit info in request for later use
        req.rateLimitInfo = rateLimitResult;
        
        // Don't block the request, let the message processor handle the response
        return next();
      }
      
      next();
    };
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      rateLimitInfo?: RateLimitCheckResult;
    }
  }
}

export default new AntiSpamMiddleware();