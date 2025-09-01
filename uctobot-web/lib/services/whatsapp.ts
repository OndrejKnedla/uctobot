import { prisma } from '@/lib/db/prisma'

export interface WhatsAppMessage {
  to: string
  body: string
  mediaUrl?: string
  mediaType?: 'image' | 'document' | 'audio'
}

export interface InteractiveButton {
  id: string
  title: string
  type?: 'button' | 'quick_reply'
}

export interface InteractiveMessage {
  to: string
  body: string
  buttons: InteractiveButton[]
  header?: string
  footer?: string
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(to: string, message: string, mediaUrl?: string) {
  // For now, this is a placeholder - in production you'd use Twilio API
  console.log(`📱 WhatsApp Message to ${to}:`, message)
  
  if (mediaUrl) {
    console.log(`📎 Media URL: ${mediaUrl}`)
  }

  // TODO: Implement actual Twilio API call
  /*
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  
  const messageOptions: any = {
    body: message,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`
  }
  
  if (mediaUrl) {
    messageOptions.mediaUrl = [mediaUrl]
  }
  
  try {
    const result = await client.messages.create(messageOptions)
    console.log(`Message sent: ${result.sid}`)
    return result
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
    throw error
  }
  */

  // Return mock success for development
  return {
    sid: `mock_${Date.now()}`,
    status: 'queued',
    to: `whatsapp:${to}`,
    body: message
  }
}

/**
 * Send interactive WhatsApp message with buttons
 */
export async function sendInteractiveMessage(message: InteractiveMessage) {
  console.log(`📱 Interactive Message to ${message.to}:`, message)
  
  // TODO: Implement Twilio Interactive Messages
  // For now, send as regular message with numbered options
  const buttonText = message.buttons
    .map((btn, idx) => `${idx + 1}️⃣ ${btn.title}`)
    .join('\n')
  
  const fullMessage = `${message.body}\n\n${buttonText}\n\nNapište číslo nebo text možnosti:`
  
  return await sendWhatsAppMessage(message.to, fullMessage)
}

/**
 * Send WhatsApp message with image
 */
export async function sendWhatsAppImage(to: string, imageUrl: string, caption?: string) {
  console.log(`📱 WhatsApp Image to ${to}: ${imageUrl}`)
  if (caption) {
    console.log(`Caption: ${caption}`)
  }
  
  // TODO: Implement actual image sending
  return await sendWhatsAppMessage(to, caption || 'Image sent', imageUrl)
}

/**
 * Send bulk WhatsApp messages (with rate limiting)
 */
export async function sendBulkMessages(messages: WhatsAppMessage[], delayMs = 1000) {
  const results = []
  
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]
    
    try {
      const result = await sendWhatsAppMessage(
        message.to, 
        message.body, 
        message.mediaUrl
      )
      results.push({ success: true, result, message: message.to })
      
      // Rate limiting - wait between messages
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      console.error(`Failed to send message to ${message.to}:`, error)
      results.push({ success: false, error, message: message.to })
    }
  }
  
  return results
}

/**
 * Format WhatsApp message with proper length limits
 */
export function formatWhatsAppMessage(message: string, maxLength = 1600): string[] {
  if (message.length <= maxLength) {
    return [message]
  }
  
  const messages = []
  let currentMessage = ''
  const lines = message.split('\n')
  
  for (const line of lines) {
    if ((currentMessage + '\n' + line).length > maxLength) {
      if (currentMessage) {
        messages.push(currentMessage.trim())
        currentMessage = line
      } else {
        // Single line is too long, split by words
        const words = line.split(' ')
        let wordChunk = ''
        
        for (const word of words) {
          if ((wordChunk + ' ' + word).length > maxLength) {
            if (wordChunk) {
              messages.push(wordChunk.trim())
              wordChunk = word
            } else {
              // Single word is too long, truncate
              messages.push(word.substring(0, maxLength - 3) + '...')
            }
          } else {
            wordChunk += (wordChunk ? ' ' : '') + word
          }
        }
        
        if (wordChunk) {
          currentMessage = wordChunk
        }
      }
    } else {
      currentMessage += (currentMessage ? '\n' : '') + line
    }
  }
  
  if (currentMessage) {
    messages.push(currentMessage.trim())
  }
  
  return messages
}

/**
 * Schedule WhatsApp message for later
 */
export async function scheduleWhatsAppMessage(
  to: string, 
  message: string, 
  scheduledFor: Date,
  type: string = 'SYSTEM'
) {
  await prisma.notification.create({
    data: {
      userId: to, // This should be userId, not phone number
      type: type as any,
      title: 'Scheduled Message',
      message: message,
      scheduledFor: scheduledFor,
      sentViaWhatsApp: false
    }
  })
}

/**
 * Process scheduled messages
 */
export async function processScheduledMessages() {
  const now = new Date()
  
  const scheduledMessages = await prisma.notification.findMany({
    where: {
      scheduledFor: { lte: now },
      sentViaWhatsApp: false
    },
    include: {
      user: {
        select: {
          whatsappPhone: true
        }
      }
    }
  })
  
  for (const notification of scheduledMessages) {
    if (notification.user.whatsappPhone) {
      try {
        await sendWhatsAppMessage(
          notification.user.whatsappPhone, 
          notification.message
        )
        
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            sentViaWhatsApp: true,
            whatsappMessageId: `scheduled_${Date.now()}`
          }
        })
        
        console.log(`Sent scheduled message to ${notification.user.whatsappPhone}`)
      } catch (error) {
        console.error(`Failed to send scheduled message:`, error)
      }
    }
  }
  
  return scheduledMessages.length
}

export default {
  sendWhatsAppMessage,
  sendInteractiveMessage,
  sendWhatsAppImage,
  sendBulkMessages,
  formatWhatsAppMessage,
  scheduleWhatsAppMessage,
  processScheduledMessages
}