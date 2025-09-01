import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message, phoneNumber } = await request.json()
    
    // Get credentials from environment
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
    const API_VERSION = 'v21.0'
    
    if (!ACCESS_TOKEN || ACCESS_TOKEN === 'your_facebook_whatsapp_access_token_here') {
      return NextResponse.json({
        success: false,
        message: 'WhatsApp API není nakonfigurována. Nastavte WHATSAPP_ACCESS_TOKEN v .env.local'
      }, { status: 400 })
    }
    
    // Send message via Facebook WhatsApp Cloud API
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber.replace('+', ''), // Remove + if present
          type: 'text',
          text: { 
            body: message || `🤖 Test zpráva z ÚčtoBot\n\n✅ WhatsApp integrace funguje správně!\n\n📱 Můžete začít používat bot pro:\n• Zaznamenávání příjmů a výdajů\n• Skenování účtenek\n• Generování přehledů`
          }
        })
      }
    )
    
    const result = await response.json()
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Zpráva byla úspěšně odeslána',
        messageId: result.messages?.[0]?.id
      })
    } else {
      console.error('WhatsApp API error:', result)
      return NextResponse.json({
        success: false,
        message: 'Nepodařilo se odeslat zprávu',
        error: result.error?.message || 'Unknown error'
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Test message error:', error)
    return NextResponse.json({
      success: false,
      message: 'Chyba při odesílání testovací zprávy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}