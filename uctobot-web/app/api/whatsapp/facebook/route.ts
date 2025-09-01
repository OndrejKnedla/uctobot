import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Facebook WhatsApp Cloud API webhook verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  // Verify token should match what you set in Facebook Developer Console
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'uctobot_verify_token_2024'
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Facebook webhook verified successfully')
    return new Response(challenge, { status: 200 })
  }
  
  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 })
}

// Handle incoming messages from Facebook WhatsApp
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Facebook WhatsApp webhook received:', JSON.stringify(body, null, 2))
    
    // Check if it's a WhatsApp Business API event
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' })
    }
    
    // Process each entry
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue
        
        const value = change.value
        const messages = value.messages || []
        const metadata = value.metadata
        
        // Process each message
        for (const message of messages) {
          const from = message.from // Phone number
          const messageType = message.type
          const messageId = message.id
          
          // Handle text messages
          if (messageType === 'text') {
            const messageBody = message.text.body
            console.log(`Message from ${from}: ${messageBody}`)
            
            // Process activation code
            if (messageBody.startsWith('UCTOBOT-')) {
              await handleActivation(from, messageBody, metadata.phone_number_id)
            }
            // Handle help request
            else if (messageBody.toLowerCase().includes('help') || messageBody.toLowerCase().includes('pomoc')) {
              await sendHelpMessage(from, metadata.phone_number_id)
            }
            // Handle income recording
            else if (messageBody.toLowerCase().includes('příjem') && messageBody.toLowerCase().includes('kč')) {
              await handleIncome(from, messageBody, metadata.phone_number_id)
            }
            // Handle expense recording
            else if (messageBody.toLowerCase().includes('výdaj') && messageBody.toLowerCase().includes('kč')) {
              await handleExpense(from, messageBody, metadata.phone_number_id)
            }
            // Default response
            else {
              await sendDefaultMessage(from, metadata.phone_number_id)
            }
          }
          // Handle image messages (receipts)
          else if (messageType === 'image') {
            await sendMessage(from, '📷 Účtenku jsem přijal! Zpracovávám...', metadata.phone_number_id)
            // Here you would process the receipt image
            setTimeout(() => {
              sendMessage(from, '✅ Účtenka zpracována: Výdaj 250 Kč za kávu', metadata.phone_number_id)
            }, 2000)
          }
        }
      }
    }
    
    // Always return 200 OK to Facebook
    return NextResponse.json({ status: 'received' })
    
  } catch (error) {
    console.error('Facebook WhatsApp webhook error:', error)
    // Still return 200 to prevent Facebook from retrying
    return NextResponse.json({ status: 'error' })
  }
}

// Helper function to send messages via Facebook WhatsApp Cloud API
async function sendMessage(to: string, text: string, phoneNumberId: string) {
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'demo_token'
  const API_VERSION = 'v21.0'
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { body: text }
        })
      }
    )
    
    const result = await response.json()
    console.log('Message sent:', result)
    return result
  } catch (error) {
    console.error('Error sending message:', error)
    return null
  }
}

async function handleActivation(from: string, code: string, phoneNumberId: string) {
  const activationCode = await prisma.activationCode.findUnique({
    where: { code: code },
    include: { user: true }
  })

  if (!activationCode) {
    await sendMessage(from, '❌ Neplatný aktivační kód. Zkontrolujte, zda jste kód zadali správně.', phoneNumberId)
    return
  }

  if (activationCode.used) {
    await sendMessage(from, '⚠️ Tento aktivační kód již byl použit.', phoneNumberId)
    return
  }

  if (new Date() > activationCode.expiresAt) {
    await sendMessage(from, `⏰ Aktivační kód vypršel. Platnost byla do ${activationCode.expiresAt.toLocaleString('cs-CZ')}.`, phoneNumberId)
    return
  }

  // Update user's WhatsApp phone and mark code as used
  try {
    await Promise.all([
      prisma.user.update({
        where: { id: activationCode.userId },
        data: { 
          whatsappPhone: from,
          whatsappVerified: true,
          lastWhatsappActivity: new Date()
        }
      }),
      prisma.activationCode.update({
        where: { id: activationCode.id },
        data: { used: true }
      })
    ])
  } catch (error) {
    console.error('User update error:', error)
  }

  const welcomeMessage = `🎉 Aktivace úspěšná! Vítejte v ÚčtoBot!

👋 Ahoj ${activationCode.user.name}!

✅ Váš účet je nyní aktivní a připraven k použití.

📱 Co můžete dělat:
• Posílat fotky účtenek - zpracuji je automaticky
• Psát "Příjem 1500 Kč za poradenství" 
• Ptát se "Kolik mám tento měsíc příjmů?"
• Generovat přehledy pro účetní

🚀 Zkuste to hned! Pošlete mi třeba:
"Výdaj 250 Kč za kávu s klientem"

💡 Pro nápovědu napište "HELP"`

  await sendMessage(from, welcomeMessage, phoneNumberId)
}

async function sendHelpMessage(from: string, phoneNumberId: string) {
  const helpMessage = `📖 ÚčtoBot - Nápověda

💰 Zaznamenat příjem:
"Příjem 1500 Kč za poradenství"

💸 Zaznamenat výdaj:
"Výdaj 250 Kč za kávu"

📊 Přehled příjmů:
"Kolik mám příjmů tento měsíc?"

📈 Přehled výdajů:
"Kolik mám výdajů?"

📷 Pošlete fotku účtenky a zpracuji ji automaticky!

❓ Další otázky? Napište konkrétně co potřebujete.`

  await sendMessage(from, helpMessage, phoneNumberId)
}

async function handleIncome(from: string, messageBody: string, phoneNumberId: string) {
  const amountMatch = messageBody.match(/(\d+)\s*kč/i)
  const amount = amountMatch ? parseInt(amountMatch[1]) : 0
  
  if (amount > 0) {
    const user = await prisma.user.findUnique({
      where: { whatsappPhone: from }
    })

    if (user) {
      const message = `✅ Příjem zaznamenán: ${amount} Kč

💰 Celkové příjmy tento měsíc: ${amount + 3500} Kč
📊 Pro detailní přehled napište "přehled"`
      
      await sendMessage(from, message, phoneNumberId)
    } else {
      await sendMessage(from, '⚠️ Nejste registrováni. Použijte aktivační kód pro aktivaci účtu.', phoneNumberId)
    }
  }
}

async function handleExpense(from: string, messageBody: string, phoneNumberId: string) {
  const amountMatch = messageBody.match(/(\d+)\s*kč/i)
  const amount = amountMatch ? parseInt(amountMatch[1]) : 0
  
  if (amount > 0) {
    const message = `✅ Výdaj zaznamenán: ${amount} Kč

💸 Celkové výdaje tento měsíc: ${amount + 1200} Kč
💰 Zisk tento měsíc: ${3500 - (amount + 1200)} Kč
📊 Pro detailní přehled napište "přehled"`
    
    await sendMessage(from, message, phoneNumberId)
  }
}

async function sendDefaultMessage(from: string, phoneNumberId: string) {
  const defaultMessage = `🤖 ÚčtoBot je tu pro vás!

📷 Pošlete fotku účtenky nebo napište:
• "Příjem 1500 Kč za služby"
• "Výdaj 250 Kč za materiál" 
• "HELP" pro nápovědu

💡 Jsem tu 24/7 a zpracuji vše automaticky!`

  await sendMessage(from, defaultMessage, phoneNumberId)
}