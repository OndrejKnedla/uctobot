import dotenv from 'dotenv';
import { TrustLevel } from '../types';

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // WhatsApp API
  meta: {
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
    whatsappToken: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'uctobot-verify-token-2024',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    baseUrl: 'https://graph.facebook.com',
  },
  
  // Database
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: {
      messageDedup: 3600, // 1 hour
      rateLimit: 86400, // 24 hours
      userCache: 300, // 5 minutes
    },
  },
  
  // Rate Limits (can be overridden by env vars)
  rateLimits: {
    weeklyLimits: {
      [TrustLevel.NEW_USER]: parseInt(process.env.WEEKLY_LIMIT_NEW || '20'),
      [TrustLevel.REGULAR]: parseInt(process.env.WEEKLY_LIMIT_REGULAR || '40'),
      [TrustLevel.VERIFIED]: parseInt(process.env.WEEKLY_LIMIT_VERIFIED || '60'),
      [TrustLevel.PREMIUM]: parseInt(process.env.WEEKLY_LIMIT_PREMIUM || '500'),
    },
    dailyBurstLimit: parseInt(process.env.DAILY_BURST_LIMIT || '15'),
    hourlyBurstLimit: parseInt(process.env.HOURLY_BURST_LIMIT || '5'),
    minSecondsBetweenMessages: parseInt(process.env.MIN_SECONDS_BETWEEN_MESSAGES || '10'),
  },
  
  // Monitoring
  monitoring: {
    freetierLimit: parseInt(process.env.FREE_TIER_LIMIT || '1000'),
    alertThresholdPercent: parseInt(process.env.ALERT_THRESHOLD_PERCENT || '80'),
    criticalThresholdPercent: parseInt(process.env.CRITICAL_THRESHOLD_PERCENT || '95'),
  },
  
  // Anti-spam
  antiSpam: {
    maxIdenticalMessages: 3,
    maxViolationsBeforeBan: 5,
    tempBanDurationHours: 24,
    weekBanDurationDays: 7,
    spamPatterns: [
      /bit\.ly|tinyurl|short\.link/i,  // URL shorteners
      /(\d{9,})/g,                      // Long numbers (phones)
      /(win|prize|claim|free\s+money)/i, // Spam keywords
      /viagra|cialis|casino/i,          // Common spam
    ],
  },
  
  // Business Logic
  business: {
    trustLevelUpgradedays: 7, // Days before NEW_USER -> REGULAR
    icoVerificationUrl: process.env.ICO_VERIFICATION_URL || 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/',
  },
  
  // OpenAI (for future use)
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
  },
};

export const isProduction = config.nodeEnv === 'production';
export const isDevelopment = config.nodeEnv === 'development';