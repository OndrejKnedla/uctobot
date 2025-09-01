import Redis from 'ioredis';
import { config } from '../config';
import logger from './logger';
import mockRedis from './mockRedis';

class RedisClient {
  private client: Redis | any;
  private usingMock: boolean = false;
  
  constructor() {
    try {
      this.client = new Redis(config.redis.url, {
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis connection failed, switching to mock implementation');
            this.switchToMock();
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true, // Don't connect immediately
      });
      
      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.usingMock = false;
      });
      
      this.client.on('error', (err) => {
        if (!this.usingMock) {
          logger.error('Redis connection error:', err);
          this.switchToMock();
        }
      });
      
      // Try to connect
      this.client.connect().catch(() => {
        this.switchToMock();
      });
    } catch (error) {
      this.switchToMock();
    }
  }
  
  private switchToMock(): void {
    if (!this.usingMock) {
      logger.warn('Switching to Mock Redis for testing');
      this.client = mockRedis;
      this.usingMock = true;
    }
  }
  
  // Rate limiting methods
  async incrementUsageCounters(phoneNumber: string): Promise<void> {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const dayStart = this.getDayStart(now);
    const hourStart = this.getHourStart(now);
    
    const pipeline = this.client.pipeline();
    
    // Weekly counter
    pipeline.incr(`usage:${phoneNumber}:week:${weekStart}`);
    pipeline.expire(`usage:${phoneNumber}:week:${weekStart}`, 8 * 24 * 60 * 60); // 8 days
    
    // Daily counter
    pipeline.incr(`usage:${phoneNumber}:day:${dayStart}`);
    pipeline.expire(`usage:${phoneNumber}:day:${dayStart}`, 25 * 60 * 60); // 25 hours
    
    // Hourly counter
    pipeline.incr(`usage:${phoneNumber}:hour:${hourStart}`);
    pipeline.expire(`usage:${phoneNumber}:hour:${hourStart}`, 61 * 60); // 61 minutes
    
    // Last message timestamp
    pipeline.set(`last_message:${phoneNumber}`, now.toISOString());
    pipeline.expire(`last_message:${phoneNumber}`, 7 * 24 * 60 * 60); // 7 days
    
    await pipeline.exec();
  }
  
  async getUsageCounters(phoneNumber: string): Promise<{
    weekly: number;
    daily: number;
    hourly: number;
    lastMessageAt: Date | null;
  }> {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const dayStart = this.getDayStart(now);
    const hourStart = this.getHourStart(now);
    
    const [weekly, daily, hourly, lastMessage] = await Promise.all([
      this.client.get(`usage:${phoneNumber}:week:${weekStart}`),
      this.client.get(`usage:${phoneNumber}:day:${dayStart}`),
      this.client.get(`usage:${phoneNumber}:hour:${hourStart}`),
      this.client.get(`last_message:${phoneNumber}`),
    ]);
    
    return {
      weekly: parseInt(weekly || '0'),
      daily: parseInt(daily || '0'),
      hourly: parseInt(hourly || '0'),
      lastMessageAt: lastMessage ? new Date(lastMessage) : null,
    };
  }
  
  // Message deduplication
  async checkMessageDuplicate(messageId: string): Promise<boolean> {
    const key = `msg:${messageId}`;
    const exists = await this.client.exists(key);
    
    if (!exists) {
      await this.client.setex(key, config.redis.ttl.messageDedup, '1');
      return false;
    }
    
    return true;
  }
  
  // Recent messages for spam detection
  async addRecentMessage(phoneNumber: string, content: string, hash: string): Promise<void> {
    const key = `recent:${phoneNumber}`;
    const value = JSON.stringify({ content, hash, timestamp: Date.now() });
    
    await this.client.lpush(key, value);
    await this.client.ltrim(key, 0, 9); // Keep last 10 messages
    await this.client.expire(key, 3600); // 1 hour
  }
  
  async getRecentMessages(phoneNumber: string, count: number = 5): Promise<Array<{
    content: string;
    hash: string;
    timestamp: number;
  }>> {
    const key = `recent:${phoneNumber}`;
    const messages = await this.client.lrange(key, 0, count - 1);
    
    return messages.map(msg => JSON.parse(msg));
  }
  
  // Ban management
  async setBan(phoneNumber: string, durationHours: number): Promise<void> {
    const key = `ban:${phoneNumber}`;
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    
    await this.client.setex(
      key,
      durationHours * 60 * 60,
      expiresAt.toISOString()
    );
  }
  
  async checkBan(phoneNumber: string): Promise<{
    isBanned: boolean;
    expiresAt?: Date;
  }> {
    const key = `ban:${phoneNumber}`;
    const banExpiry = await this.client.get(key);
    
    if (banExpiry) {
      return {
        isBanned: true,
        expiresAt: new Date(banExpiry),
      };
    }
    
    return { isBanned: false };
  }
  
  async removeBan(phoneNumber: string): Promise<void> {
    await this.client.del(`ban:${phoneNumber}`);
  }
  
  // Weekly reset
  async resetWeeklyLimits(): Promise<number> {
    const pattern = 'usage:*:week:*';
    const keys = await this.client.keys(pattern);
    
    if (keys.length > 0) {
      const deleted = await this.client.del(...keys);
      return deleted;
    }
    
    return 0;
  }
  
  // Helper methods
  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }
  
  private getDayStart(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }
  
  private getHourStart(date: Date): string {
    const d = new Date(date);
    d.setMinutes(0, 0, 0);
    return d.toISOString().substring(0, 13);
  }
  
  // Utility methods
  async ping(): Promise<string> {
    return await this.client.ping();
  }
  
  async flushAll(): Promise<void> {
    if (config.nodeEnv === 'development') {
      await this.client.flushall();
    }
  }
  
  getClient(): Redis {
    return this.client;
  }
}

export default new RedisClient();