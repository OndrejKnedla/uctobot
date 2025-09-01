// Mock Redis implementation for testing when Redis is not available
import logger from './logger';

class MockRedis {
  private store: Map<string, { value: string; expiry?: number }> = new Map();
  
  async ping(): Promise<string> {
    return 'PONG';
  }
  
  async set(key: string, value: string): Promise<void> {
    this.store.set(key, { value });
  }
  
  async setex(key: string, seconds: number, value: string): Promise<void> {
    const expiry = Date.now() + (seconds * 1000);
    this.store.set(key, { value, expiry });
  }
  
  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  async exists(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return 0;
    }
    
    return 1;
  }
  
  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (parseInt(current || '0') + 1).toString();
    await this.set(key, newValue);
    return parseInt(newValue);
  }
  
  async expire(key: string, seconds: number): Promise<void> {
    const item = this.store.get(key);
    if (item) {
      const expiry = Date.now() + (seconds * 1000);
      this.store.set(key, { ...item, expiry });
    }
  }
  
  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }
  
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }
  
  async lpush(key: string, ...values: string[]): Promise<number> {
    const current = await this.get(key);
    const list = current ? JSON.parse(current) : [];
    list.unshift(...values);
    await this.set(key, JSON.stringify(list));
    return list.length;
  }
  
  async ltrim(key: string, start: number, stop: number): Promise<void> {
    const current = await this.get(key);
    if (current) {
      const list = JSON.parse(current);
      const trimmed = list.slice(start, stop + 1);
      await this.set(key, JSON.stringify(trimmed));
    }
  }
  
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const current = await this.get(key);
    if (!current) return [];
    
    const list = JSON.parse(current);
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }
  
  multi() {
    return new MockRedisPipeline();
  }
  
  pipeline() {
    return new MockRedisPipeline();
  }
  
  // Clean up expired keys periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiry && now > item.expiry) {
        this.store.delete(key);
      }
    }
  }
  
  disconnect(): void {
    logger.info('Mock Redis disconnected');
  }
}

class MockRedisPipeline {
  private commands: Array<() => Promise<any>> = [];
  
  incr(key: string) {
    this.commands.push(() => mockRedis.incr(key));
    return this;
  }
  
  expire(key: string, seconds: number) {
    this.commands.push(() => mockRedis.expire(key, seconds));
    return this;
  }
  
  set(key: string, value: string) {
    this.commands.push(() => mockRedis.set(key, value));
    return this;
  }
  
  async exec() {
    const results = [];
    for (const command of this.commands) {
      try {
        const result = await command();
        results.push([null, result]);
      } catch (error) {
        results.push([error, null]);
      }
    }
    return results;
  }
}

const mockRedis = new MockRedis();

// Clean up expired keys every 5 minutes
setInterval(() => {
  mockRedis.cleanup();
}, 5 * 60 * 1000);

export default mockRedis;