import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { processReceiptWithGoogleVision } from '@/lib/ocr'
import CurrencyService from '@/lib/services/currencyService'
import ExportService from '@/lib/services/exportService'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    console.log('WhatsApp webhook received:', body)
    
    // Parse webhook payload (Twilio format)
    const params = new URLSearchParams(body)
    const from = params.get('From')?.replace('whatsapp:', '')
    const messageBody = params.get('Body')?.trim()
    const numMedia = parseInt(params.get('NumMedia') || '0')
    const mediaUrl = params.get('MediaUrl0')
    const mediaContentType = params.get('MediaContentType0')
    
    // Handle media messages (images)
    if (numMedia > 0 && mediaUrl) {
      console.log(`Received image from ${from}: ${mediaUrl}`)
      console.log(`Content type: ${mediaContentType}`)
      
      try {
        // Process receipt with Google Vision OCR
        const receiptData = await processReceiptWithGoogleVision(mediaUrl)
        console.log('OCR Result:', receiptData)
        
        // Find user in database
        const user = await prisma.user.findUnique({
          where: { whatsappPhone: from }
        })
        
        if (!user) {
          // User not found - will be handled later in registration flow
          const message = `⚠️ **Nejste registrováni**
          
Nejdřív se musíte zaregistrovat pomocí aktivačního kódu.
          
💡 **Jak na to:**
1. Získejte aktivační kód na uctobot.cz  
2. Pošlete kód sem na WhatsApp
3. Dokončete registraci
4. Pak můžete posílat účtenky!

🌐 **Registrace:** https://uctobot.cz`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        }
        
        if (!user.isProfileComplete) {
          // User exists but hasn't completed registration
          const message = `📝 **Dokončete nejdřív registraci**
          
Vaše registrace není kompletní. Napište libovolnou zprávu pro pokračování v registračním procesu.

📋 **Potřebuji od vás:**
${!user.firstName ? '• Křestní jméno' : ''}
${!user.lastName ? '• Příjmení' : ''}
${!user.companyAddress ? '• Adresa firmy' : ''}
${!user.ico ? '• IČO' : ''}
${!user.dic && user.registrationStep < 6 ? '• DIČ (nebo "nemám")' : ''}

✨ Po dokončení budete moci posílat účtenky!`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        }
        
        // Save receipt to database if user exists and has valid data
        let savedReceipt = null;
        let savedTransaction = null;
        
        if (receiptData.amount && receiptData.amount > 0) {
          // Save receipt
          savedReceipt = await prisma.receipt.create({
            data: {
              userId: user.id,
              merchant: receiptData.merchant,
              ico: receiptData.ico,
              dic: receiptData.dic,
              receiptNumber: receiptData.receiptNumber,
              totalAmount: receiptData.amount,
              currency: receiptData.currency,
              receiptDate: receiptData.date ? new Date(receiptData.date) : new Date(),
              ocrRawText: receiptData.rawText,
              vatInfo: receiptData.vatInfo ? JSON.stringify(receiptData.vatInfo) : null,
              totalVat: receiptData.totalVat || null,
              totalBase: receiptData.totalBase || null,
              category: receiptData.category,
              imageUrl: mediaUrl
            }
          });
          
          // Create expense transaction
          savedTransaction = await prisma.transaction.create({
            data: {
              userId: user.id,
              type: 'EXPENSE',
              amount: receiptData.amount,
              description: `${receiptData.merchant || 'Neznámý obchod'} - ${receiptData.category || 'Ostatní'}`,
              category: receiptData.category || 'Ostatní',
              transactionDate: receiptData.date ? new Date(receiptData.date) : new Date(),
              receiptId: savedReceipt.id,
              vatRate: receiptData.vatInfo?.[0]?.rate || null,
              vatAmount: receiptData.totalVat || null,
              netAmount: receiptData.totalBase || null
            }
          });
          
          console.log('Saved receipt and transaction:', { receiptId: savedReceipt.id, transactionId: savedTransaction.id });
        }
        
        // Format response message
        const responseMessage = `📸 **Účtenka zpracována!**

✅ **Rozpoznáno z obrázku:**

🏪 **Obchod:** ${receiptData.merchant || 'Nerozpoznáno'}
💰 **Částka:** ${receiptData.amount ? `${receiptData.amount.toFixed(2)} ${receiptData.currency}` : 'Nerozpoznáno'}
📅 **Datum:** ${receiptData.date || new Date().toLocaleDateString('cs-CZ')}
📂 **Kategorie:** ${receiptData.category || 'Ostatní'}

${receiptData.ico ? `🏢 **IČO:** ${receiptData.ico}` : ''}${receiptData.dic ? `\n🆔 **DIČ:** ${receiptData.dic}` : ''}${receiptData.receiptNumber ? `\n📄 **Doklad č.:** ${receiptData.receiptNumber}` : ''}

${receiptData.vatInfo && receiptData.vatInfo.length > 0 ? `💸 **DPH informace:**
${receiptData.vatInfo.map(vat => `• Sazba ${vat.rate}%: základ ${vat.base.toFixed(2)} Kč, DPH ${vat.amount.toFixed(2)} Kč`).join('\n')}
📊 **Celkem DPH:** ${receiptData.totalVat?.toFixed(2) || '0'} Kč` : ''}

${receiptData.items.length > 0 ? `🛒 **Položky:**
${receiptData.items.slice(0, 3).map(item => `• ${item}`).join('\n')}
${receiptData.items.length > 3 ? `• ...a dalších ${receiptData.items.length - 3} položek` : ''}` : ''}

${savedReceipt && savedTransaction ? `💾 **Uloženo do databáze**
📧 ID účtenky: ${savedReceipt.id.substring(0, 8)}...
📊 ID transakce: ${savedTransaction.id.substring(0, 8)}...` : '💾 **Uloženo do výdajů**'}

📊 **Dnešní souhrn:**
• Příjmy: 0 Kč  
• Výdaje: ${receiptData.amount ? receiptData.amount.toFixed(2) : '0'} Kč
• Zůstatek: ${receiptData.amount ? `-${receiptData.amount.toFixed(2)}` : '0'} Kč

💡 Tip: Napište **"přehled"** pro měsíční souhrn`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
        
      } catch (error) {
        console.error('OCR processing error:', error)
        
        // Fallback response on error
        const errorMessage = `📸 Účtenku jsem přijal!

⚠️ **Při zpracování došlo k chybě**

🔄 Zkuste prosím:
• Vyfotit účtenku znovu (lépe osvětlena)
• Nebo napište částku ručně: "výdaj 250 obchod"

💡 Tip: Napište **"pomoc"** pro nápovědu`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${errorMessage}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
    }
    
    if (!from || !messageBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log(`Message from ${from}: ${messageBody}`)

    // Check if message is an activation code (UCTOBOT- or TEST- prefix)
    if (messageBody.startsWith('UCTOBOT-') || messageBody.startsWith('TEST-')) {
      const activationCode = await prisma.activationCode.findUnique({
        where: { code: messageBody },
        include: { user: true }
      })

      if (!activationCode) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Neplatný aktivační kód. Zkontrolujte, zda jste kód zadali správně.</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }

      if (activationCode.used) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Tento aktivační kód již byl použit.</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }

      if (new Date() > activationCode.expiresAt) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Aktivační kód vypršel. Platnost byla do ${activationCode.expiresAt.toLocaleString('cs-CZ')}.</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }

      // Check if phone number is already used by another user
      const existingUserWithPhone = await prisma.user.findUnique({
        where: { whatsappPhone: from }
      })
      
      if (existingUserWithPhone && existingUserWithPhone.id !== activationCode.userId) {
        // Phone number is already used by another user - clear it first
        await prisma.user.update({
          where: { id: existingUserWithPhone.id },
          data: { 
            whatsappPhone: null,
            whatsappVerified: false
          }
        })
      }

      // Update user's WhatsApp phone and mark code as used - start registration
      try {
        await Promise.all([
          prisma.user.update({
            where: { id: activationCode.userId },
            data: { 
              whatsappPhone: from,
              whatsappVerified: true,
              lastWhatsappActivity: new Date(),
              registrationStep: 1 // Start registration flow
            }
          }),
          prisma.activationCode.update({
            where: { id: activationCode.id },
            data: { used: true }
          })
        ])
      } catch (error) {
        console.error('User update error:', error)
        // Mark code as used anyway
        await prisma.activationCode.update({
          where: { id: activationCode.id },
          data: { used: true }
        })
      }

      const welcomeMessage = `🎉 **Skvěle! Váš ÚčtoBot je aktivní!**

Jsem váš osobní účetní asistent dostupný 24/7 📱

📝 **Pro začátek potřebuji pár informací...**

**Krok 1/5:** Jak se jmenujete?
Napište prosím vaše **křestní jméno**`

      // Return TwiML response for Twilio
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${welcomeMessage}</Message>
</Response>`
      
      return new Response(twiml, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml'
        }
      })
    }

    // Handle other messages - basic bot responses
    const lowerMessage = messageBody.toLowerCase()
    
    // Handle help command for everyone (even unregistered users)
    if (lowerMessage.includes('help') || lowerMessage.includes('pomoc') || lowerMessage.includes('napoveda')) {
      const helpMessage = `📚 **NÁPOVĚDA - ÚčtoBot**

**🤖 Jsem váš osobní účetní asistent!**

🟢 **ZÁKLADNÍ PŘÍKAZY:**
• **příjem 500 popis** - Zaznamenat příjem
• **výdaj 200 popis** - Zaznamenat výdaj  
• **faktura 5000 dodavatel** - Přijatá faktura
• **vystavit 8000 zákazník** - Vystavit fakturu
• **přehled** - Měsíční souhrn

📸 **ÚČTENKY:** Pošlete fotku pro automatické zpracování!

📄 **EXPORTY:**
• **export** - CSV za aktuální měsíc
• **export říjen 2024** - Konkrétní měsíc
• **export dph** - XML DPH přiznání
• **export kontrolni** - Kontrolní hlášení

⚙️ **DALŠÍ PŘÍKAZY:**
• **MENU** - Hlavní menu
• **nastavení** - Konfigurace bota
• **briefing** - Ranní přehled
• **graf** - Vizuální reporty

🌍 **Podporujeme:**
• 🇨🇿 Češtinu • 🇸🇰 Slovenštinu • 🇬🇧 Angličtinu
• EUR, USD, GBP měny s automatickým převodem
• České i slovenské názvy měsíců

💡 **Tip:** Funguje i bez diakritiky (rijen = říjen)

🚀 **Pro začátek potřebujete registraci na uctobot.cz**`

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${helpMessage}</Message>
</Response>`
      
      return new Response(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      })
    }
    
    // Find user in database
    let user = await prisma.user.findUnique({
      where: { whatsappPhone: from }
    })
    
    // If no user exists, show welcome message
    if (!user) {
      const welcomeMessage = `👋 **Vítejte v ÚčtoBot!**

Jsem váš osobní účetní asistent pro OSVČ 🤖

Pro začátek potřebujete **aktivační kód**.

🎯 **Jak získat kód:**
1. Navštivte **uctobot.cz**
2. Registrujte se a získejte aktivační kód
3. Pošlete kód sem na WhatsApp

📝 **Formát kódu:**
• TEST-XXXXXXXX (testovací)
• UCTOBOT-XXXXXXXX (produkční)

Jakmile pošlete platný kód, spustí se registrace.`

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${welcomeMessage}</Message>
</Response>`
      
      return new Response(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      })
    }
    
    // Handle registration flow FIRST for incomplete profiles
    if (user && !user.isProfileComplete) {
      const registrationStep = user.registrationStep || 1
      
      // Check if user is trying to provide both names at once
      const nameParts = messageBody.trim().split(' ')
      if (registrationStep === 1 && nameParts.length >= 2) {
        // User provided both first and last name
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(' ')
        
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            firstName: firstName,
            lastName: lastName,
            registrationStep: 3 // Skip to address step
          }
        })
        
        const skipToStep3Message = `✅ **${firstName} ${lastName}** - skvěle!

**Krok 3/5:** Kde máte **sídlo firmy**?
Napište adresu (ulice, město)`
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${skipToStep3Message}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
      
      switch (registrationStep) {
        case 1: // Collecting first name
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              firstName: messageBody.trim(),
              registrationStep: 2
            }
          })
          
          const step2Message = `✅ Děkuji, **${messageBody.trim()}**!

**Krok 2/5:** Jaké je vaše **příjmení**?`
          
          const step2Twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${step2Message}</Message>
</Response>`
          
          return new Response(step2Twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
          
        case 2: // Collecting last name
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              lastName: messageBody.trim(),
              registrationStep: 3
            }
          })
          
          const step3Message = `✅ **${user.firstName} ${messageBody.trim()}** - skvěle!

**Krok 3/5:** Kde máte **sídlo firmy**?
Napište adresu (ulice, město)`
          
          const step3Twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${step3Message}</Message>
</Response>`
          
          return new Response(step3Twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
          
        case 3: // Collecting company address
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              companyAddress: messageBody.trim(),
              registrationStep: 4
            }
          })
          
          const step4Message = `✅ Adresa zaznamenána!

**Krok 4/5:** Jaké je **IČO** vaší firmy?
(8-místné číslo, např. 12345678)`
          
          const step4Twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${step4Message}</Message>
</Response>`
          
          return new Response(step4Twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
          
        case 4: // Collecting IČO
          // Validate IČO format (8 digits)
          const icoMatch = messageBody.match(/(\d{8})/)
          if (!icoMatch) {
            const icoErrorMessage = `❌ **Neplatné IČO!**

IČO musí být 8-místné číslo (např. 12345678).
Zkuste to prosím znovu:`
            
            const icoErrorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${icoErrorMessage}</Message>
</Response>`
            
            return new Response(icoErrorTwiml, {
              status: 200,
              headers: { 'Content-Type': 'text/xml' }
            })
          }
          
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              ico: icoMatch[1],
              registrationStep: 5
            }
          })
          
          const step5Message = `✅ IČO **${icoMatch[1]}** uloženo!

**Krok 5/5:** Máte **DIČ**? 
Napište DIČ (např. CZ12345678) nebo "nemám"`
          
          const step5Twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${step5Message}</Message>
</Response>`
          
          return new Response(step5Twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
          
        case 5: // Collecting DIČ and completing registration
          let dic = null
          if (!lowerMessage.includes('nemám') && !lowerMessage.includes('neměm')) {
            const dicMatch = messageBody.match(/(CZ\d{8,10}|cz\d{8,10})/i)
            if (dicMatch) {
              dic = dicMatch[1].toUpperCase()
            }
          }
          
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              dic: dic,
              isProfileComplete: true,
              registrationStep: 6, // Complete
              name: `${user.firstName} ${user.lastName}` // Combine full name
            }
          })
          
          // Try to give first achievement for completing registration
          try {
            await prisma.achievement.create({
              data: {
                userId: user.id,
                type: 'MILESTONE',
                title: 'První kroky!',
                description: 'Dokončili jste registraci v ÚčtoBot',
                badgeEmoji: '🎯',
                points: 100,
                unlockedAt: new Date()
              }
            })
          } catch (achievementError) {
            console.error('Achievement creation failed:', achievementError)
            // Continue anyway - don't block registration completion
          }
          
          const completionMessage = `🎉 **Registrace dokončena!**

Váš profil je kompletní:
👤 **${user.firstName} ${user.lastName}**
🏢 ${user.companyAddress}
🏪 IČO: ${user.ico}
${dic ? `📋 DIČ: ${dic}` : '📋 DIČ: nemáte'}

🏆 **Získali jste první achievement!** +100 bodů

📱 **HLAVNÍ MENU** - Vyberte číslo 1-5:

**1️⃣ PŘIJATÁ FAKTURA**
   📥 Zaznamenat fakturu od dodavatele

**2️⃣ VYSTAVIT FAKTURU**
   📤 Vytvořit fakturu pro zákazníka

**3️⃣ PŘÍJEM / VÝDAJ**
   💰 Rychlé zadání příjmu nebo výdaje

**4️⃣ MĚSÍČNÍ PŘEHLED**
   📊 Souhrn příjmů, výdajů a daní

**5️⃣ NÁPOVĚDA**
   ❓ Seznam všech příkazů

📸 Nebo pošlete **fotku účtenky** pro automatické zpracování

🆕 **NOVÉ FUNKCE:**
• **briefing** - Ranní přehled financí
• **achievementy** - Vaše úspěchy a série
• **graf** - Vizuální reporty  
• **nastavení** - Upravit preference

Napište číslo 1-5 nebo název funkce:`
          
          const completionTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${completionMessage}</Message>
</Response>`
          
          return new Response(completionTwiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
      }
    }
    
    // Handle menu selections for registered users
    if (user && user.isProfileComplete) {
      // Check for menu number selections (1-5)
      if (messageBody === '1' || lowerMessage.includes('přijatá faktura') || lowerMessage.includes('prijata faktura')) {
        const invoiceMessage = `📥 **PŘIJATÁ FAKTURA**

Pro zaznamenání přijaté faktury zadejte údaje v tomto formátu:

**Formát:**
faktura [částka] [dodavatel] [datum]

**Příklady:**
• faktura 5000 Vodafone 15.3.
• faktura 12500 nájem kancelář
• faktura 3200 účetní služby

Nebo pošlete **fotku faktury** 📸

Pro návrat do menu napište **MENU**`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${invoiceMessage}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
      
      if (messageBody === '2' || lowerMessage.includes('vystavit fakturu')) {
        const issuedInvoiceMessage = `📤 **VYSTAVIT FAKTURU**

Pro vystavení faktury zadejte údaje:

**Formát:**
vystavit [částka] [odběratel] [popis]

**Příklady:**
• vystavit 15000 ABC s.r.o. konzultace
• vystavit 8500 Jan Novák webové stránky
• vystavit 25000 Firma XY marketingové služby

Systém automaticky:
✅ Přiřadí číslo faktury
✅ Vypočítá DPH (pokud jste plátce)
✅ Nastaví splatnost 14 dní

Pro návrat do menu napište **MENU**`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${issuedInvoiceMessage}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
      
      if (messageBody === '3' || lowerMessage.includes('příjem') || lowerMessage.includes('výdaj')) {
        const transactionMessage = `💰 **PŘÍJEM / VÝDAJ**

Zadejte transakci jednoduše:

**PŘÍJMY:**
• příjem 5000 konzultace
• p 8000 prodej zboží
• tržba 3500 služby

**VÝDAJE:**
• výdaj 1200 benzín
• v 350 oběd s klientem
• náklad 2500 kancelářské potřeby

**Rychlé zkratky:**
• p [částka] = příjem
• v [částka] = výdaj

📸 Nebo pošlete **fotku dokladu**

Pro návrat do menu napište **MENU**`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${transactionMessage}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
      
      if (messageBody === '4' || lowerMessage.includes('přehled') || lowerMessage.includes('souhrn')) {
        // Get actual data from database for current month
        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Get transactions for current month
        const transactions = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            transactionDate: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          orderBy: { transactionDate: 'desc' }
        });
        
        // Calculate totals
        const income = transactions
          .filter(t => t.type === 'INCOME')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const expenses = transactions
          .filter(t => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const profit = income - expenses;
        const vatToPay = income * 0.21 - expenses * 0.21; // Simplified VAT calculation
        
        const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
          'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
        const currentMonthName = monthNames[currentMonth.getMonth()];
        
        const summaryMessage = `📊 **MĚSÍČNÍ PŘEHLED** - ${currentMonthName} ${currentMonth.getFullYear()}

💰 **PŘÍJMY:** ${income.toLocaleString('cs-CZ')} Kč
💸 **VÝDAJE:** ${expenses.toLocaleString('cs-CZ')} Kč  
📈 **ZISK:** ${profit.toLocaleString('cs-CZ')} Kč

🏦 **DAŇOVÉ POVINNOSTI:**
• DPH k odvodu: ${Math.max(0, vatToPay).toLocaleString('cs-CZ')} Kč
• Záloha na daň: ${Math.max(0, profit * 0.15).toLocaleString('cs-CZ')} Kč

📅 **Tento měsíc:**
• Transakcí: ${transactions.length}
• Průměrný příjem: ${transactions.filter(t => t.type === 'INCOME').length > 0 ? Math.round(income / transactions.filter(t => t.type === 'INCOME').length).toLocaleString('cs-CZ') : '0'} Kč
• Průměrný výdaj: ${transactions.filter(t => t.type === 'EXPENSE').length > 0 ? Math.round(expenses / transactions.filter(t => t.type === 'EXPENSE').length).toLocaleString('cs-CZ') : '0'} Kč

${profit < 0 ? '⚠️ **Upozornění:** Tento měsíc máte ztrátu!' : '✅ **Skvěle:** Máte zisk!'}

Pro návrat do menu napište **MENU**`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${summaryMessage}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
      
      if (messageBody === '5' || lowerMessage.includes('pomoc') || lowerMessage.includes('nápověda') || lowerMessage.includes('napoveda')) {
        const helpMessage = `❓ **KOMPLETNÍ NÁPOVĚDA**

📱 **HLAVNÍ MENU:** Napište číslo 1-5
**1️⃣** - Přijatá faktura • **2️⃣** - Vystavit fakturu  
**3️⃣** - Příjem / Výdaj • **4️⃣** - Měsíční přehled
**5️⃣** - Tato nápověda

📸 **ÚČTENKY:** Pošlete fotku pro OCR

💰 **RYCHLÉ PŘÍKAZY:**
• **p 500** = příjem 500 Kč • **v 200** = výdaj 200 Kč
• **faktura 5000 dodavatel** • **vystavit 10000 zákazník**

🆕 **POKROČILÉ FUNKCE:**
• **briefing** - Ranní přehled financí (+ nastavení času)
• **achievementy** - Vaše úspěchy a gamifikace
• **graf** - Vizuální grafy (P&L, cash flow, kategorie)
• **nastavení** - Automatické zprávy, AI, multi-firma

📊 **REPORTY:**
• **přehled** - Aktuální měsíc • **4** - Detailní přehled
• **graf 1** - P&L graf • **graf 2** - Cash flow

📄 **EXPORT PRO ÚČETNÍ:**
• **export** - Aktuální měsíc (CSV)
• **export říjen** nebo **export oktober** (SK) - Konkrétní měsíc
• **export 2024-10** nebo **export 10/2024** - Měsíc s rokem
• **export q1 2024** - Čtvrtletí s rokem
• **export dph** nebo **export 2024-10 dph** - DPH přiznání (XML)
• **export kontrolni** - Kontrolní hlášení (XML)

⚙️ **NASTAVENÍ:**
• **briefing 08:00** - Změní čas • **briefing off** - Vypne
• **večer off** - Vypne večerní report • **ai off** - Vypne AI

🔄 **MENU** - Hlavní menu • 💡 Bez diakritiky OK!`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${helpMessage}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
      
      if (lowerMessage === 'menu' || lowerMessage === 'hlavní menu' || lowerMessage === 'hlavni menu') {
        const mainMenuMessage = `📱 **HLAVNÍ MENU** - Vyberte číslo 1-5:

**1️⃣ PŘIJATÁ FAKTURA**
   📥 Zaznamenat fakturu od dodavatele

**2️⃣ VYSTAVIT FAKTURU**
   📤 Vytvořit fakturu pro zákazníka

**3️⃣ PŘÍJEM / VÝDAJ**
   💰 Rychlé zadání příjmu nebo výdaje

**4️⃣ MĚSÍČNÍ PŘEHLED**
   📊 Souhrn příjmů, výdajů a daní

**5️⃣ NÁPOVĚDA**
   ❓ Seznam všech příkazů

📸 Nebo pošlete **fotku účtenky** pro automatické zpracování

🆕 **NOVÉ FUNKCE:**
• **briefing** - Ranní přehled financí
• **achievementy** - Vaše úspěchy a série
• **graf** - Vizuální reporty  
• **nastavení** - Upravit preference

Napište číslo 1-5 nebo název funkce:`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${mainMenuMessage}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
      
      // Process invoice commands with currency support
      if (lowerMessage.startsWith('faktura ')) {
        try {
          // Detect currency in the message
          const currencyInfo = CurrencyService.detectCurrency(messageBody)
          
          if (!currencyInfo || currencyInfo.amount <= 0) {
            const errorMessage = `❌ **Neplatný formát faktury**
            
**Správný formát:**
• faktura 5000 Dodavatel (CZK)
• faktura 200 euro Dodavatel  
• faktura 150€ Dodavatel
• faktura $100 Dodavatel

**Příklady:**
• faktura 5000 Vodafone
• faktura 200 euro Makro
• faktura $150 Amazon`

            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${errorMessage}</Message>
</Response>`
            
            return new Response(twiml, {
              status: 200,
              headers: { 'Content-Type': 'text/xml' }
            })
          }
          
          // Extract supplier name (everything after amount and currency)
          let supplierText = messageBody.replace(/faktura/i, '').trim()
          // Remove the amount and currency part
          supplierText = supplierText.replace(/^\d+(?:\.\d+)?\s*(?:euro?|eur|€|\$|usd|dollar?|dolar|gbp|libr[ay]?|£|kc|czk|korun?)?\s*/i, '')
          const supplier = supplierText || 'Neznámý dodavatel'
          
          // Convert to CZK if needed
          const conversion = await CurrencyService.convertToCZK(currencyInfo.amount, currencyInfo.currency)
          
          // Create expense transaction for received invoice
          const transaction = await prisma.transaction.create({
            data: {
              userId: user.id,
              type: 'EXPENSE',
              amount: conversion.convertedAmount,
              description: `Faktura - ${supplier}`,
              category: 'Faktura',
              transactionDate: new Date(),
              // Store original currency info in notes if different
              notes: currencyInfo.currency !== 'CZK' ? 
                `Původní částka: ${CurrencyService.formatCurrency(currencyInfo.amount, currencyInfo.currency)} (kurz ${conversion.exchangeRate})` : 
                undefined
            }
          })
          
          // Build confirmation message
          let confirmMessage = `✅ **Přijatá faktura zaznamenána**

💸 **Částka:** ${conversion.convertedAmount.toLocaleString('cs-CZ')} Kč`
          
          // Show original currency if converted
          if (currencyInfo.currency !== 'CZK') {
            confirmMessage += `
💱 **Původní:** ${CurrencyService.formatCurrency(currencyInfo.amount, currencyInfo.currency)} (kurz ${conversion.exchangeRate})`
          }
          
          confirmMessage += `
🏢 **Dodavatel:** ${supplier}
📅 **Datum:** ${new Date().toLocaleDateString('cs-CZ')}
🆔 **ID:** ${transaction.id.substring(0, 8)}...

📊 Napište **4** pro měsíční přehled
📱 Napište **MENU** pro hlavní menu`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${confirmMessage}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
          
        } catch (error) {
          console.error('Invoice processing error:', error)
          
          const errorMessage = `❌ **Chyba při zpracování faktury**
          
${error instanceof Error ? error.message : 'Neočekávaná chyba'}

Zkuste znovu nebo kontaktujte podporu.`

          const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${errorMessage}</Message>
</Response>`
          
          return new Response(errorTwiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        }
      }
      
      // Process issued invoice commands
      if (lowerMessage.startsWith('vystavit ')) {
        const parts = messageBody.replace(/vystavit/i, '').trim().split(' ')
        const amount = parseFloat(parts[0]) || 0
        const customer = parts.slice(1).join(' ') || 'Neznámý zákazník'
        
        if (amount > 0) {
          // Create income transaction for issued invoice
          const transaction = await prisma.transaction.create({
            data: {
              userId: user.id,
              type: 'INCOME',
              amount: amount,
              description: `Vystavená faktura - ${customer}`,
              category: 'Faktura',
              transactionDate: new Date()
            }
          })
          
          // Generate invoice number
          const invoiceNumber = `2024${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
          
          const confirmMessage = `✅ **Faktura vystavena**

📄 **Číslo faktury:** ${invoiceNumber}
💰 **Částka:** ${amount.toLocaleString('cs-CZ')} Kč
🏢 **Odběratel:** ${customer}
📅 **Datum vystavení:** ${new Date().toLocaleDateString('cs-CZ')}
📅 **Splatnost:** ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('cs-CZ')}
${user.dic ? `💸 **DPH 21%:** ${(amount * 0.21).toLocaleString('cs-CZ')} Kč` : ''}
🆔 **ID:** ${transaction.id.substring(0, 8)}...

📊 Napište **4** pro měsíční přehled
📱 Napište **MENU** pro hlavní menu`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${confirmMessage}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        }
      }
      
      // Handle new advanced commands for complete profiles
      if (lowerMessage.includes('briefing') || lowerMessage.includes('ranní přehled')) {
        try {
          const DailyBriefingService = (await import('@/lib/services/dailyBriefing')).default
          await DailyBriefingService.sendMorningBriefingToUser(user.id)
          
          const confirmMessage = `📊 **BRIEFING ODESLÁN**
          
Ranní přehled byl vygenerován a odeslán!

💡 **Tip:** Briefing se automaticky odesílá každé ráno v ${user.preferredTime || '07:00'}

Pro změnu času napište: **"briefing 08:00"**
Pro vypnutí: **"briefing off"**`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${confirmMessage}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        } catch (error) {
          console.error('Briefing error:', error)
        }
      }
      
      if (lowerMessage.includes('achievementy') || lowerMessage.includes('úspěchy') || lowerMessage.includes('achievements')) {
        const achievements = await prisma.achievement.findMany({
          where: { userId: user.id },
          orderBy: { unlockedAt: 'desc' },
          take: 10
        })
        
        const achievementMessage = achievements.length > 0 ? 
          `🏆 **VAŠE ÚSPĚCHY** (${achievements.length} celkem)

${achievements.map((ach, idx) => 
  `${ach.badgeEmoji} **${ach.title}**
   ${ach.description}
   ${ach.points} bodů • ${ach.unlockedAt.toLocaleDateString('cs-CZ')}`
).slice(0, 5).join('\n\n')}

${achievements.length > 5 ? `\n... a dalších ${achievements.length - 5} úspěchů!` : ''}

🔥 **Aktuální série:** ${user.currentStreak} dní
🎯 **Nejdelší série:** ${user.longestStreak} dní
📊 **Celkem bodů:** ${achievements.reduce((sum, a) => sum + a.points, 0)}

💪 Pokračujte v dobré práci!` :
          
          `🏆 **VAŠE ÚSPĚCHY**

Zatím žádné úspěchy neodemčeny.

🎯 **Jak získat první úspěch:**
• Používejte ÚčtoBot 7 dní v řadě 🔥
• Zaznamenejte prvních 100 transakcí 📊  
• Dosáhněte prvních 100 000 Kč tržeb 💰

Každý úspěch přináší body a speciální badge! 

Napište **MENU** pro pokračování`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${achievementMessage}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
      
      if (lowerMessage.includes('graf') || lowerMessage.includes('chart')) {
        const interactiveMessage = `📊 **VIZUÁLNÍ REPORTY**

Vyberte typ grafu:

**1️⃣ Měsíční P&L** - Příjmy vs výdaje
**2️⃣ Cash Flow** - Tok peněz za 30 dní  
**3️⃣ Výdaje podle kategorií** - Kde utrácíte nejvíc
**4️⃣ Daňový přehled** - Čtvrtletní daně

Graf vám pošlu jako obrázek do 30 sekund!

Napište číslo pro výběr:`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${interactiveMessage}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
      
      // Handle chart generation requests
      if (['graf 1', 'graf1', 'chart 1'].includes(lowerMessage)) {
        try {
          const ChartGenerationService = (await import('@/lib/services/chartGeneration')).default
          
          const message = `📊 **GENERUJI GRAF...**
          
Měsíční P&L graf se připravuje...
Pošlu vám ho za chvilku jako obrázek! ⏳`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`

          // Generate chart asynchronously (in real implementation)
          // const chartBuffer = await ChartGenerationService.generateMonthlyPLChart(user.id)
          // const chartUrl = await ChartGenerationService.saveChartToDatabase(user.id, 'MONTHLY_PL', new Date().toISOString().substring(0, 7), chartBuffer)
          // await sendWhatsAppImage(user.whatsappPhone, chartUrl, 'Váš měsíční P&L graf')
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        } catch (error) {
          console.error('Chart generation error:', error)
        }
      }
      
      // Export commands - Enhanced parsing for any month/year
      if (lowerMessage.startsWith('export ')) {
        try {
          const params = messageBody.replace(/export /i, '').trim().toLowerCase()
          const currentYear = new Date().getFullYear()
          const currentMonth = new Date().getMonth() + 1
          
          // Parse date from various formats
          function parseExportDate(params: string): { month: number, year: number, quarter?: number } {
            // Default to current or previous month
            let month = currentMonth - 1 || 12
            let year = month === 12 ? currentYear - 1 : currentYear
            let quarter: number | undefined
            
            // Year parsing - 2020-2030 range
            const yearMatch = params.match(/\b(20\d{2})\b/)
            if (yearMatch) {
              const parsedYear = parseInt(yearMatch[1])
              if (parsedYear >= 2020 && parsedYear <= 2030) {
                year = parsedYear
              }
            }
            
            // Quarter parsing - q1, q2, q3, q4, 1q, 2q, etc.
            const quarterMatch = params.match(/\b(?:q([1-4])|([1-4])q)\b/)
            if (quarterMatch) {
              quarter = parseInt(quarterMatch[1] || quarterMatch[2])
              return { month: 0, year, quarter }
            }
            
            // Month parsing - čísla, české názvy, slovenské názvy, anglické názvy
            const monthMap: { [key: string]: number } = {
              // České názvy
              'leden': 1, 'únor': 2, 'unor': 2, 'březen': 3, 'brezen': 3,
              'duben': 4, 'květen': 5, 'kveten': 5, 'červen': 6, 'cerven': 6,
              'červenec': 7, 'cervenec': 7, 'srpen': 8, 'září': 9, 'zari': 9,
              'říjen': 10, 'rijen': 10, 'listopad': 11, 'prosinec': 12,
              // Slovenské názvy
              'január': 1, 'januar': 1, 'február': 2, 'februar': 2, 'marec': 3,
              'apríl': 4, 'april': 4, 'máj': 5, 'maj': 5, 'jún': 6, 'jun': 6,
              'júl': 7, 'jul': 7, 'august': 8, 'september': 9, 'október': 10, 'oktober': 10,
              'november': 11, 'december': 12,
              // Anglické názvy
              'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
              'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
              // Čísla jako stringy
              '1': 1, '01': 1, '2': 2, '02': 2, '3': 3, '03': 3, '4': 4, '04': 4,
              '5': 5, '05': 5, '6': 6, '06': 6, '7': 7, '07': 7, '8': 8, '08': 8,
              '9': 9, '09': 9, '10': 10, '11': 11, '12': 12
            }
            
            // Check for YYYY-MM format first (2024-10)
            const dateMatch = params.match(/\b(20\d{2})[-\/\.](\d{1,2})\b/)
            if (dateMatch) {
              const yearPart = parseInt(dateMatch[1])
              const monthPart = parseInt(dateMatch[2])
              if (yearPart >= 2020 && yearPart <= 2030 && monthPart >= 1 && monthPart <= 12) {
                return { month: monthPart, year: yearPart }
              }
            }
            
            // Check for MM/YYYY or MM-YYYY format (10/2024)
            const reverseDateMatch = params.match(/\b(\d{1,2})[-\/\.](20\d{2})\b/)
            if (reverseDateMatch) {
              const monthPart = parseInt(reverseDateMatch[1])
              const yearPart = parseInt(reverseDateMatch[2])
              if (yearPart >= 2020 && yearPart <= 2030 && monthPart >= 1 && monthPart <= 12) {
                return { month: monthPart, year: yearPart }
              }
            }
            
            // Find month name/number in params
            for (const [key, value] of Object.entries(monthMap)) {
              if (params.includes(key)) {
                month = value
                // If year was found, use it, otherwise use current year for future months
                if (!yearMatch && month > currentMonth) {
                  year = currentYear - 1  // Previous year for future months when no year specified
                } else if (!yearMatch) {
                  year = currentYear
                }
                break
              }
            }
            
            return { month, year }
          }
          
          let exportContent = ''
          let fileName = ''
          let format = 'csv'
          
          const parsedDate = parseExportDate(params)
          
          if (params === 'dph' || params.includes('dph')) {
            // DPH přiznání s možností specifikovat měsíc/rok
            const { month, year } = parsedDate
            if (month > 0) {
              exportContent = await ExportService.generateDPHPriznaniXML(user.id, month, year)
              fileName = `${year}-${month.toString().padStart(2, '0')}_DPH_Priznani_${user.firstName}_${user.lastName}.xml`
              format = 'xml'
            }
          } else if (params.includes('kontrolni') || params.includes('kh')) {
            // Kontrolní hlášení s možností specifikovat měsíc/rok
            const { month, year } = parsedDate
            exportContent = await ExportService.generateKontrolniHlaseniXML(user.id, month, year)
            fileName = `${year}-${month.toString().padStart(2, '0')}_Kontrolni_Hlaseni_${user.firstName}_${user.lastName}.xml`
            format = 'xml'
          } else if (parsedDate.quarter) {
            // Čtvrtletní export s možností specifikovat rok
            const { quarter, year } = parsedDate
            exportContent = await ExportService.generateQuarterlyExport(user.id, quarter, year, 'csv')
            fileName = `${year}_Q${quarter}_Export_${user.firstName}_${user.lastName}.csv`
          } else {
            // Měsíční CSV export pro libovolný měsíc/rok
            const { month, year } = parsedDate
            exportContent = await ExportService.generateMonthlyCSV(user.id, month, year)
            fileName = `${year}-${month.toString().padStart(2, '0')}_Mesicni_Export_${user.firstName}_${user.lastName}.csv`
          }
          
          if (!exportContent) {
            const errorMessage = `❌ **Nepodařilo se vytvořit export**
            
**📅 Formáty data:**
• **export leden** - Měsíc (český název)
• **export január** - Měsíc (slovenský název)  
• **export january** - Měsíc (anglický název)
• **export 1** nebo **01** - Měsíc (číslo)
• **export 2024-01** - Konkrétní měsíc/rok
• **export 01/2024** - Alternativní formát
• **export říjen 2023** - Měsíc s rokem

**📊 Typy exportů:**
• **export** - CSV za poslední měsíc
• **export dph** - XML DPH přiznání
• **export kontrolni** - XML kontrolní hlášení  
• **export q1** nebo **q1 2023** - Čtvrtletí

**✅ Příklady příkazů:**
• export prosinec 2023
• export 2024-05 dph
• export q2 2024
• export september kontrolni`

            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${errorMessage}</Message>
</Response>`
            
            return new Response(twiml, {
              status: 200,
              headers: { 'Content-Type': 'text/xml' }
            })
          }
          
          // V produkci by se soubor uložil do cloudu a poslal URL
          const downloadUrl = await ExportService.saveExport(
            user.id,
            format === 'xml' ? (params.includes('dph') ? 'DPH' : 'KH') : 'Monthly',
            fileName.split('_')[0],
            format,
            exportContent
          )
          
          const successMessage = `📄 **Export dokončen!**
          
**Soubor:** ${fileName}
**Velikost:** ${Math.round(exportContent.length / 1024)} KB
**Formát:** ${format.toUpperCase()}

${format === 'xml' ? 
  `🏛️ **XML pro finanční úřad připraven**
  
📋 **Obsah:**
${params.includes('dph') ? '• DPH přiznání podle předpisů' : '• Kontrolní hlášení s přijatými fakturami'}
• Všechny povinné údaje vyplněny
• Kompatibilní s úředními systémy` :
  `📊 **CSV export obsahuje:**
• Všechny transakce za období
• Příjmy, výdaje, faktury
• Kategorie a DIČ
• Připraveno pro účetní`}

💾 **Stáhnout:** ${downloadUrl}

📨 **Tip:** Soubor si můžete přeposlat emailem nebo uložit do cloudu`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${successMessage}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
          
        } catch (error) {
          console.error('Export error:', error)
          
          const errorMessage = `❌ **Chyba při exportu**
          
${error instanceof Error ? error.message : 'Neočekávaná chyba'}

**Možné příčiny:**
• Neúplné údaje v profilu (DIČ, adresa)
• Žádná data za vybrané období
• Systémová chyba

Zkuste znovu nebo kontaktujte podporu.`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${errorMessage}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        }
      }
      
      if (lowerMessage.includes('nastavení') || lowerMessage.includes('settings')) {
        const settingsMessage = `⚙️ **NASTAVENÍ**

**📅 Automatické zprávy:**
• Ranní briefing: ${user.dailyBriefingEnabled ? '✅ Zapnut' : '❌ Vypnut'} (${user.preferredTime})
• Večerní report: ${user.eveningReportEnabled ? '✅ Zapnut' : '❌ Vypnut'}

**🎯 Gamifikace:**
• Trust level: ${user.trustLevel}
• Aktuální série: ${user.currentStreak} dní
• AI učení: ${user.aiLearningEnabled ? '✅ Zapnut' : '❌ Vypnut'}

**💰 Multi-firma:**
${user.currentCompanyId ? '• Aktivní firma: ' + user.currentCompanyId : '• Jedna firma'}

**⚙️ Příkazy pro změny:**
• **"briefing off"** - Vypne ranní briefing
• **"briefing 08:00"** - Změní čas na 8:00
• **"večer off"** - Vypne večerní report
• **"ai off"** - Vypne AI učení

Pro návrat napište **MENU**`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${settingsMessage}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
      
      // Handle settings changes
      if (lowerMessage.startsWith('briefing ')) {
        const param = lowerMessage.replace('briefing ', '').trim()
        let updateData: any = {}
        let responseMessage = ''
        
        if (param === 'off' || param === 'vypnout') {
          updateData.dailyBriefingEnabled = false
          responseMessage = '📅 Ranní briefing byl vypnut'
        } else if (param.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/)) {
          updateData.preferredTime = param
          updateData.dailyBriefingEnabled = true
          responseMessage = `📅 Ranní briefing nastaven na ${param}`
        } else if (param === 'on' || param === 'zapnout') {
          updateData.dailyBriefingEnabled = true
          responseMessage = `📅 Ranní briefing zapnut (${user.preferredTime})`
        }
        
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: updateData
          })
          
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}

Pro návrat do nastavení napište **NASTAVENÍ**</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        }
      }
    }
    

    if (lowerMessage.includes('příjem') && lowerMessage.includes('kč')) {
      // Extract amount and description from message
      const amountMatch = messageBody.match(/(\d+)\s*kč/i)
      const amount = amountMatch ? parseInt(amountMatch[1]) : 0
      
      if (amount > 0) {
        if (!user) {
          const message = `⚠️ **Nejste registrováni**
          
Pro zaznamenávání transakcí se nejdřív zaregistrujte pomocí aktivačního kódu z uctobot.cz`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        }

        if (!user.isProfileComplete) {
          const message = `📝 **Dokončete nejdřív registraci**
          
Pro zaznamenávání příjmů dokončete registrační proces. Napište libovolnou zprávu pro pokračování.`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        }

        if (user) {
          // Here you would create an income record
          // For demo, just acknowledge
          const message = `✅ **Zaznamenáno!**

**Příjem:** ${amount} Kč
${messageBody.replace(/příjem/i, '').replace(/\d+/, '').replace(/kč/i, '').trim() ? `**Popis:** ${messageBody.replace(/příjem/i, '').replace(/\d+/, '').replace(/kč/i, '').trim()}` : ''}

📊 **Dnešní souhrn:**
• Příjmy: ${amount} Kč
• Výdaje: 0 Kč
• Zůstatek: ${amount} Kč

💡 Tip: Přidejte fotku dokladu příkazem FOTO`
          
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        }
      }
    }

    if (lowerMessage.includes('výdaj') && lowerMessage.includes('kč')) {
      const amountMatch = messageBody.match(/(\d+)\s*kč/i)
      const amount = amountMatch ? parseInt(amountMatch[1]) : 0
      
      if (amount > 0) {
        if (!user) {
          const message = `⚠️ **Nejste registrováni**
          
Pro zaznamenávání transakcí se nejdřív zaregistrujte pomocí aktivačního kódu z uctobot.cz`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        }

        if (!user.isProfileComplete) {
          const message = `📝 **Dokončete nejdřív registraci**
          
Pro zaznamenávání výdajů dokončete registrační proces. Napište libovolnou zprávu pro pokračování.`

          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
          
          return new Response(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          })
        }
        const message = `✅ **Zaznamenáno!**

**Výdaj:** ${amount} Kč
${messageBody.replace(/výdaj/i, '').replace(/\d+/, '').replace(/kč/i, '').trim() ? `**Popis:** ${messageBody.replace(/výdaj/i, '').replace(/\d+/, '').replace(/kč/i, '').trim()}` : ''}

📊 **Dnešní souhrn:**
• Příjmy: 0 Kč
• Výdaje: ${amount} Kč
• Zůstatek: -${amount} Kč

💡 Tip: Napište "měsíc" pro měsíční přehled`
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
    }

    // Handle overview/summary requests  
    if (lowerMessage.includes('přehled') || lowerMessage.includes('prehled') || 
        lowerMessage.includes('souhrn') || lowerMessage.includes('měsíc')) {
      
      const user = await prisma.user.findUnique({
        where: { whatsappPhone: from }
      })
      
      if (!user) {
        const message = `⚠️ **Nejste registrováni**
        
Nejdřív se musíte zaregistrovat pomocí aktivačního kódu.

🌐 **Registrace:** https://uctobot.cz`

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
        
        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
      
      // Get actual data from database for current month
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      // Get transactions for current month
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          transactionDate: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        orderBy: { transactionDate: 'desc' }
      });
      
      // Calculate totals
      const income = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expenses = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const profit = income - expenses;
      
      // Group expenses by category
      const expensesByCategory = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => {
          const category = t.category || 'Ostatní';
          acc[category] = (acc[category] || 0) + Number(t.amount);
          return acc;
        }, {} as Record<string, number>);
      
      // Sort categories by amount
      const topCategories = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 4);
      
      // Count receipts this month
      const receiptsCount = await prisma.receipt.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });
      
      const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
        'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
      const currentMonthName = monthNames[currentMonth.getMonth()];
      
      const message = `📊 **MĚSÍČNÍ PŘEHLED** - ${currentMonthName} ${currentMonth.getFullYear()}

💰 **PŘÍJMY:** ${income.toLocaleString('cs-CZ')} Kč
💸 **VÝDAJE:** ${expenses.toLocaleString('cs-CZ')} Kč  
📈 **ZISK:** ${profit.toLocaleString('cs-CZ')} Kč

${topCategories.length > 0 ? `🔥 **TOP výdaje:**
${topCategories.map(([category, amount], index) => 
  `${index + 1}. ${category}: ${amount.toLocaleString('cs-CZ')} Kč`
).join('\n')}` : ''}

📅 **Tento měsíc:**
• Transakcí: ${transactions.length}
• Účtenek: ${receiptsCount}
• Průměrný výdaj: ${transactions.length > 0 ? Math.round(expenses / Math.max(transactions.filter(t => t.type === 'EXPENSE').length, 1)).toLocaleString('cs-CZ') : '0'} Kč

${profit < 0 ? '⚠️ **Upozornění:** Tento měsíc máte ztrátu!' : '✅ **Skvěle:** Máte zisk!'}

📄 Pro export napište **"EXPORT"**`
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
      
      return new Response(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      })
    }

    // Default response
    const defaultMessage = `🤔 Tomu jsem nerozuměl...

**Zkuste to takto:**
• "příjem 1500 konzultace"
• "výdaj 250 oběd"
• "přehled" - měsíční souhrn

Nebo pošlete fotku účtenky 📸

💡 Nápověda: napište **POMOC**`
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${defaultMessage}</Message>
</Response>`
    
    return new Response(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    })

  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Verify webhook (for Twilio)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('hub.challenge')
  
  if (challenge) {
    return new Response(challenge, { status: 200 })
  }
  
  return NextResponse.json({ status: 'WhatsApp webhook endpoint active' })
}