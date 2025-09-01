import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';
import redisClient from '../utils/redis';
import antiSpamMiddleware from '../middleware/antiSpam';
import { WhatsAppMessage, RateLimitCheckResult, TrustLevel, TRUST_LIMITS, MessageResponse } from '../types';

const prisma = new PrismaClient();

interface ProcessResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export class MessageProcessor {
  
  async processMessage(
    message: WhatsAppMessage,
    rateLimitInfo?: RateLimitCheckResult
  ): Promise<ProcessResult> {
    try {
      logger.info(`Processing message from ${message.from}`);
      
      // Get user
      const user = await this.getOrCreateUser(message.from);
      
      // Update trust level if needed
      await antiSpamMiddleware.updateTrustLevel(message.from);
      
      // Handle rate limiting
      if (rateLimitInfo && !rateLimitInfo.allowed) {
        await this.handleRateLimit(message, rateLimitInfo);
        return { success: true }; // Successfully handled rate limit
      }
      
      // Extract message text
      const messageText = message.text?.body || '';
      
      // Spam detection
      const isSpam = await antiSpamMiddleware.detectSpamPatterns(messageText, message.from);
      if (isSpam) {
        await this.handleSpam(message);
        return { success: true }; // Successfully handled spam
      }
      
      // Increment usage counters
      await this.incrementUsageCounters(message.from);
      
      // Business logic - process the actual message
      const response = await this.handleBusinessLogic(message, user);
      
      if (response) {
        const messageId = await this.sendMessage(message.from, response);
        return { success: true, messageId };
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Message processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private async handleRateLimit(
    message: WhatsAppMessage,
    rateLimitInfo: RateLimitCheckResult
  ): Promise<void> {
    let responseMessage = '';
    
    switch (rateLimitInfo.reason) {
      case 'WEEKLY_LIMIT':
        responseMessage = rateLimitInfo.message || 
          `📊 Týdenní limit vyčerpán. Reset v pondělí.`;
        break;
        
      case 'DAILY_BURST':
        responseMessage = rateLimitInfo.message ||
          `⏸️ Denní limit dosažen. Pokračuj zítra.`;
        break;
        
      case 'HOURLY_LIMIT':
        responseMessage = rateLimitInfo.message ||
          `⏱️ Hodinový limit dosažen. Počkej hodinu.`;
        break;
        
      case 'TOO_FAST':
        responseMessage = rateLimitInfo.message ||
          `⏱️ Příliš rychle! Počkaj ${rateLimitInfo.waitSeconds} sekund.`;
        break;
        
      case 'BANNED':
        responseMessage = `🚫 Účet dočasně zablokován do ${rateLimitInfo.resetDate?.toLocaleString('cs-CZ')}.`;
        break;
        
      default:
        responseMessage = '⚠️ Překročen limit zpráv. Zkus to později.';
    }
    
    // Add usage info if available
    if (rateLimitInfo.currentUsage && rateLimitInfo.limits) {
      responseMessage += `\n\n📈 Tvoje využití:\n`;
      responseMessage += `• Tento týden: ${rateLimitInfo.currentUsage.weekly}/${rateLimitInfo.limits.weeklyMax}\n`;
      responseMessage += `• Dnes: ${rateLimitInfo.currentUsage.daily}/${rateLimitInfo.limits.dailyMax}\n`;
      responseMessage += `• Tuto hodinu: ${rateLimitInfo.currentUsage.hourly}/${rateLimitInfo.limits.hourlyMax}`;
    }
    
    await this.sendMessage(message.from, { type: 'text', text: { body: responseMessage } });
    
    // Mark message as rate limited in DB
    await prisma.message.updateMany({
      where: {
        waMessageId: message.id
      },
      data: {
        status: 'RATE_LIMITED'
      }
    });
  }
  
  private async handleSpam(message: WhatsAppMessage): Promise<void> {
    const responseMessage = `⚠️ Detekována podezřelá aktivita. Pokračování povede k dočasnému zablokování účtu.`;
    
    await this.sendMessage(message.from, { type: 'text', text: { body: responseMessage } });
    
    // Mark message as spam in DB
    await prisma.message.updateMany({
      where: {
        waMessageId: message.id
      },
      data: {
        status: 'SPAM',
        isSpam: true
      }
    });
  }
  
  private async handleBusinessLogic(message: WhatsAppMessage, user: any): Promise<MessageResponse | null> {
    const messageText = message.text?.body?.toLowerCase().trim() || '';
    
    // Welcome message for new users
    if (!user.lastMessageAt) {
      const trustLevel = user.trustLevel as TrustLevel;
      const limits = TRUST_LIMITS[trustLevel];
      
      return {
        type: 'text',
        text: {
          body: `👋 Vítej v UctoBot!\n\n` +
                `🎁 Máš ${limits.weeklyMax} zpráv zdarma tento týden.\n` +
                `📸 Pošli fotku faktury nebo napiš 'pomoc' pro nápovědu.\n\n` +
                `💡 Tip: Po týdnu používání se zvýší tvůj limit na ${TRUST_LIMITS.REGULAR.weeklyMax} zpráv!`
        }
      };
    }
    
    // Handle help commands
    if (messageText.includes('pomoc') || messageText.includes('help')) {
      return this.getHelpMessage(user);
    }
    
    // Handle usage/stats commands  
    if (messageText.includes('limit') || messageText.includes('využití') || messageText.includes('stats')) {
      return await this.getUsageMessage(user);
    }
    
    // Handle ICO verification
    if (messageText.includes('ico') || messageText.match(/^\d{8}$/)) {
      return await this.handleIcoVerification(message.from, messageText);
    }
    
    // Handle image messages (invoices)
    if (message.type === 'image') {
      return await this.handleInvoiceImage(message);
    }
    
    // Handle document messages
    if (message.type === 'document') {
      return await this.handleDocument(message);
    }
    
    // Default response for unrecognized messages
    return {
      type: 'text',
      text: {
        body: `🤖 UctoBot - Účetní asistent\n\n` +
              `📸 Pošli fotku faktury pro zpracování\n` +
              `📄 Pošli PDF dokument\n` +
              `💬 Napiš 'pomoc' pro více možností\n` +
              `📊 Napiš 'limit' pro info o využití`
      }
    };
  }
  
  private getHelpMessage(user: any): MessageResponse {
    const trustLevel = user.trustLevel as TrustLevel;
    const limits = TRUST_LIMITS[trustLevel];
    
    return {
      type: 'text',
      text: {
        body: `🤖 UctoBot - Nápověda\n\n` +
              `📸 **Faktura** - pošli fotku faktury\n` +
              `📄 **Dokument** - pošli PDF soubor\n` +
              `🏢 **IČO** - napiš své IČO pro ověření\n` +
              `📊 **Limit** - info o využití\n` +
              `💡 **Pomoc** - tato nápověda\n\n` +
              `📈 **Tvůj účet:** ${limits.description}\n` +
              `📊 **Týdenní limit:** ${limits.weeklyMax} zpráv\n` +
              `⚡ **Max za den:** ${limits.dailyMax} zpráv`
      }
    };
  }
  
  private async getUsageMessage(user: any): Promise<MessageResponse> {
    const usage = await redisClient.getUsageCounters(user.phoneNumber);
    const trustLevel = user.trustLevel as TrustLevel;
    const limits = TRUST_LIMITS[trustLevel];
    
    const nextMonday = this.getNextMonday();
    
    return {
      type: 'text',
      text: {
        body: `📊 **Využití účtu**\n\n` +
              `📈 **Tento týden:** ${usage.weekly}/${limits.weeklyMax} zpráv\n` +
              `📅 **Dnes:** ${usage.daily}/${limits.dailyMax} zpráv\n` +
              `⏰ **Tuto hodinu:** ${usage.hourly}/${limits.hourlyMax} zpráv\n\n` +
              `🏆 **Úroveň účtu:** ${limits.description}\n` +
              `🔄 **Reset limitů:** ${nextMonday.toLocaleDateString('cs-CZ')}\n\n` +
              `💡 **Tip:** ${this.getUpgradeTip(trustLevel)}`
      }
    };
  }
  
  private async handleIcoVerification(phoneNumber: string, message: string): Promise<MessageResponse> {
    const icoMatch = message.match(/\d{8}/);
    if (!icoMatch) {
      return {
        type: 'text',
        text: {
          body: `🏢 Pro ověření firmy napiš své IČO (8 číslic).\n\nPříklad: 12345678`
        }
      };
    }
    
    const ico = icoMatch[0];
    
    // Update user with ICO
    await prisma.user.update({
      where: { phoneNumber },
      data: { ico }
    });
    
    // Update trust level
    await antiSpamMiddleware.updateTrustLevel(phoneNumber);
    
    const updatedUser = await prisma.user.findUnique({ where: { phoneNumber } });
    const trustLevel = updatedUser?.trustLevel as TrustLevel;
    const limits = TRUST_LIMITS[trustLevel];
    
    if (trustLevel === TrustLevel.VERIFIED) {
      return {
        type: 'text',
        text: {
          body: `✅ **IČO ověřeno!**\n\n` +
                `🏆 Tvůj účet byl povýšen na: **${limits.description}**\n` +
                `📊 **Nový týdenní limit:** ${limits.weeklyMax} zpráv\n` +
                `⚡ **Max za den:** ${limits.dailyMax} zpráv\n\n` +
                `🎉 Gratuluji! Teď můžeš posílat více zpráv.`
        }
      };
    } else {
      return {
        type: 'text',
        text: {
          body: `🏢 IČO ${ico} bylo uloženo.\n\n` +
                `⏳ Ověření může trvat několik minut.\n` +
                `📧 Budeš upozorněn při změně úrovně účtu.`
        }
      };
    }
  }
  
  private async handleInvoiceImage(message: WhatsAppMessage): Promise<MessageResponse> {
    // Placeholder for invoice processing
    // In real implementation, you'd download the image and process it with OCR
    
    return {
      type: 'text',
      text: {
        body: `📸 **Faktura přijata**\n\n` +
              `⏳ Zpracovávám obrázek faktury...\n` +
              `📊 Výsledky pošlu během několika sekund.\n\n` +
              `💡 **Tip:** Pro lepší výsledky focítej fakturu z blízka a dobře nasvícenou.`
      }
    };
  }
  
  private async handleDocument(message: WhatsAppMessage): Promise<MessageResponse> {
    // Placeholder for document processing
    
    return {
      type: 'text',
      text: {
        body: `📄 **Dokument přijat**\n\n` +
              `⏳ Zpracovávám PDF dokument...\n` +
              `📊 Výsledky pošlu během chvilky.\n\n` +
              `✅ **Podporované formáty:** PDF, JPG, PNG`
      }
    };
  }
  
  private getUpgradeTip(trustLevel: TrustLevel): string {
    switch (trustLevel) {
      case TrustLevel.NEW_USER:
        return `Používej UctoBot ${config.business.trustLevelUpgradedays} dní pro zvýšení limitu na ${TRUST_LIMITS.REGULAR.weeklyMax} zpráv/týden!`;
      case TrustLevel.REGULAR:
        return `Ověř své IČO pro zvýšení limitu na ${TRUST_LIMITS.VERIFIED.weeklyMax} zpráv/týden!`;
      case TrustLevel.VERIFIED:
        return `Zvažuješ Premium pro ${TRUST_LIMITS.PREMIUM.weeklyMax} zpráv/týden?`;
      default:
        return `Máš Premium účet s maximálními limity!`;
    }
  }
  
  private async sendMessage(to: string, message: MessageResponse): Promise<string> {
    try {
      // Mock response for testing (when using test credentials)
      if (config.meta.whatsappToken.includes('test_')) {
        const mockMessageId = `mock_msg_${Date.now()}`;
        logger.info(`[MOCK] Message would be sent to ${to}: ${message.text?.body?.substring(0, 50)}...`);
        logger.debug('[MOCK] Full message:', message);
        return mockMessageId;
      }
      
      // Real API call for production
      const response = await axios.post(
        `${config.meta.baseUrl}/${config.meta.apiVersion}/${config.meta.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          ...message
        },
        {
          headers: {
            'Authorization': `Bearer ${config.meta.whatsappToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      logger.info(`Message sent to ${to}:`, response.data.messages?.[0]?.id);
      return response.data.messages?.[0]?.id || '';
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }
  
  private async incrementUsageCounters(phoneNumber: string): Promise<void> {
    await redisClient.incrementUsageCounters(phoneNumber);
    
    // Update user's last message timestamp
    await prisma.user.update({
      where: { phoneNumber },
      data: {
        lastMessageAt: new Date(),
        totalMessageCount: {
          increment: 1
        }
      }
    });
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
    }
    
    return user;
  }
  
  private getNextMonday(): Date {
    const d = new Date();
    const day = d.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + daysUntilMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

export default MessageProcessor;