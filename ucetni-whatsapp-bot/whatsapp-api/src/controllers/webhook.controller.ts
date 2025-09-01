import { Request, Response } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import logger from '../utils/logger';
import redisClient from '../utils/redis';
import MessageProcessor from '../services/messageProcessor';
import { WebhookPayload, WhatsAppMessage } from '../types';

const prisma = new PrismaClient();
const messageProcessor = new MessageProcessor();

export class WebhookController {
  // GET webhook verification
  async verify(req: Request, res: Response): Promise<void> {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      logger.info('Webhook verification attempt', { mode, token: token?.toString().substring(0, 5) + '...' });
      
      if (mode && token) {
        if (mode === 'subscribe' && token === config.meta.webhookVerifyToken) {
          logger.info('Webhook verified successfully');
          res.status(200).send(challenge);
          return;
        }
      }
      
      logger.warn('Webhook verification failed');
      res.sendStatus(403);
    } catch (error) {
      logger.error('Webhook verification error:', error);
      res.sendStatus(500);
    }
  }
  
  // POST webhook handler
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Immediately respond to acknowledge receipt
      res.sendStatus(200);
      
      // Validate signature
      if (!this.validateSignature(req)) {
        logger.warn('Invalid webhook signature');
        return;
      }
      
      const payload = req.body as WebhookPayload;
      
      // Log webhook for debugging
      await this.logWebhook(payload, req.headers);
      
      // Process each entry
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          await this.processChange(change, req);
        }
      }
    } catch (error) {
      logger.error('Webhook processing error:', error);
      // Already sent 200, so just log the error
    }
  }
  
  private validateSignature(req: Request): boolean {
    if (config.nodeEnv === 'development') {
      return true; // Skip in development
    }
    
    const signature = req.get('X-Hub-Signature-256');
    if (!signature) {
      return false;
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', config.meta.appSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    const expectedSignatureHeader = `sha256=${expectedSignature}`;
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignatureHeader)
    );
  }
  
  private async processChange(change: any, req: Request): Promise<void> {
    const { value } = change;
    
    // Handle message statuses (delivered, read, etc.)
    if (value.statuses) {
      await this.handleStatuses(value.statuses);
      return;
    }
    
    // Handle incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        await this.handleMessage(message, value.metadata, req);
      }
    }
  }
  
  private async handleMessage(
    message: WhatsAppMessage,
    metadata: any,
    req: Request
  ): Promise<void> {
    try {
      // Check for duplicate message
      const isDuplicate = await redisClient.checkMessageDuplicate(message.id);
      if (isDuplicate) {
        logger.debug(`Duplicate message ${message.id} ignored`);
        return;
      }
      
      // Store message in database
      const user = await this.getOrCreateUser(message.from);
      
      const dbMessage = await prisma.message.create({
        data: {
          waMessageId: message.id,
          userId: user.id,
          fromNumber: message.from,
          toNumber: metadata.display_phone_number,
          content: message.text?.body || null,
          contentHash: message.text?.body ? 
            crypto.createHash('sha256').update(message.text.body).digest('hex') : null,
          messageType: message.type,
          status: 'PENDING'
        }
      });
      
      // Process message asynchronously
      this.processMessageAsync(dbMessage.id, message, req);
      
    } catch (error) {
      logger.error('Failed to handle message:', error);
    }
  }
  
  private async processMessageAsync(
    messageId: string,
    message: WhatsAppMessage,
    req: Request
  ): Promise<void> {
    try {
      // Process with rate limiting and spam detection
      const result = await messageProcessor.processMessage(message, req.rateLimitInfo);
      
      // Update message status
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: result.success ? 'PROCESSED' : 'FAILED',
          processedAt: new Date(),
          errorMessage: result.error || null
        }
      });
      
    } catch (error) {
      logger.error('Async message processing failed:', error);
      
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  private async handleStatuses(statuses: any[]): Promise<void> {
    for (const status of statuses) {
      logger.debug('Message status update:', {
        id: status.id,
        status: status.status,
        timestamp: status.timestamp
      });
      
      // You can update message delivery status here if needed
      // await prisma.message.update({
      //   where: { responseId: status.id },
      //   data: { deliveryStatus: status.status }
      // });
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
          trustLevel: 'NEW_USER',
          rateLimits: {
            create: {}
          }
        }
      });
      
      logger.info(`New user created: ${phoneNumber}`);
    }
    
    return user;
  }
  
  private async logWebhook(payload: any, headers: any): Promise<void> {
    try {
      await prisma.webhookLog.create({
        data: {
          eventType: payload.entry?.[0]?.changes?.[0]?.field || 'unknown',
          payload: JSON.stringify(payload),
          headers: JSON.stringify(headers),
          status: 'RECEIVED'
        }
      });
    } catch (error) {
      logger.error('Failed to log webhook:', error);
    }
  }
  
  // Health check endpoint
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Check Redis connection
      await redisClient.ping();
      
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: 'connected',
          redis: 'connected'
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Stats endpoint
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [
        totalUsers,
        activeUsers,
        todayMessages,
        monthMessages
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            lastMessageAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        }),
        prisma.message.count({
          where: {
            createdAt: { gte: today }
          }
        }),
        prisma.message.count({
          where: {
            createdAt: {
              gte: new Date(today.getFullYear(), today.getMonth(), 1)
            }
          }
        })
      ]);
      
      const freeTrierRemaining = config.monitoring.freetierLimit - monthMessages;
      const percentUsed = (monthMessages / config.monitoring.freetierLimit) * 100;
      
      res.json({
        users: {
          total: totalUsers,
          active: activeUsers
        },
        messages: {
          today: todayMessages,
          thisMonth: monthMessages,
          freeTrierRemaining,
          percentUsed: Math.round(percentUsed)
        },
        alerts: this.getAlerts(percentUsed)
      });
    } catch (error) {
      logger.error('Failed to get stats:', error);
      res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
  }
  
  private getAlerts(percentUsed: number): Array<{level: string; message: string}> {
    const alerts = [];
    
    if (percentUsed >= config.monitoring.criticalThresholdPercent) {
      alerts.push({
        level: 'CRITICAL',
        message: `Free tier usage at ${Math.round(percentUsed)}%! Switch to Phase 2 immediately!`
      });
    } else if (percentUsed >= config.monitoring.alertThresholdPercent) {
      alerts.push({
        level: 'WARNING',
        message: `Free tier usage at ${Math.round(percentUsed)}%. Consider switching soon.`
      });
    }
    
    return alerts;
  }
}

export default new WebhookController();