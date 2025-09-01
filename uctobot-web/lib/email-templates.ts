export interface ActivationEmailData {
  customerName: string;
  customerEmail: string;
  activationCode: string;
  expiresAt: string;
  plan: 'MONTHLY' | 'YEARLY';
  isFoundingMember: boolean;
  whatsappNumber: string;
}

export function generateActivationEmailHTML(data: ActivationEmailData): string {
  const planName = data.plan === 'MONTHLY' ? 'měsíční' : 'roční';
  const planPrice = data.plan === 'MONTHLY' ? '199 Kč/měsíc' : '1990 Kč/rok';
  const foundingBadge = data.isFoundingMember ? 
    '<div style="background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; display: inline-block; margin: 10px 0;">🏆 Zakladatelský člen</div>' : '';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Váš aktivační kód pro DokladBot</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #25D366, #128C7E); color: white; padding: 30px 40px; text-align: center;">
      <div style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">
        💼 DokladBot
      </div>
      <div style="font-size: 16px; opacity: 0.9;">
        Vaše chytré účetnictví přes WhatsApp
      </div>
    </div>

    <!-- Main content -->
    <div style="padding: 40px;">
      
      <!-- Greeting -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #25D366; font-size: 24px; margin: 0 0 10px 0;">
          Děkujeme za nákup, ${data.customerName}! 🎉
        </h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0;">
          Vaše platba byla úspěšně zpracována. Níže najdete vše potřebné pro aktivaci DokladBotu.
        </p>
      </div>

      ${foundingBadge}

      <!-- Activation code box -->
      <div style="background: linear-gradient(135deg, #f8f9ff, #e8f4fd); border: 2px solid #25D366; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
        <div style="font-size: 18px; color: #333; margin-bottom: 15px; font-weight: 600;">
          🔑 Váš aktivační kód
        </div>
        <div style="background: white; border: 2px dashed #25D366; border-radius: 8px; padding: 20px; margin: 15px 0;">
          <div style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #25D366; letter-spacing: 2px;">
            ${data.activationCode}
          </div>
        </div>
        <div style="font-size: 14px; color: #e74c3c; margin-top: 15px;">
          ⏰ Kód vyprší: ${data.expiresAt}
        </div>
      </div>

      <!-- Instructions -->
      <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #25D366; font-size: 18px; margin: 0 0 15px 0;">
          📱 Jak aktivovat DokladBot:
        </h3>
        <div style="font-size: 15px; line-height: 1.6; color: #333;">
          <div style="margin-bottom: 12px;">
            <strong>1.</strong> Otevřete WhatsApp na vašem telefonu
          </div>
          <div style="margin-bottom: 12px;">
            <strong>2.</strong> Napište zprávu na číslo: 
            <span style="background: #25D366; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
              ${data.whatsappNumber}
            </span>
          </div>
          <div style="margin-bottom: 12px;">
            <strong>3.</strong> Pošlete tento text: 
            <div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin: 8px 0; font-family: monospace;">
              Aktivace ${data.activationCode}
            </div>
          </div>
          <div>
            <strong>4.</strong> DokladBot vás provede dokončením nastavení 🚀
          </div>
        </div>
      </div>

      <!-- Plan info -->
      <div style="border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 15px 0;">
          📋 Shrnutí vašeho předplatného:
        </h3>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="color: #666;">Plán:</span>
          <span style="font-weight: bold; color: #25D366;">${planName.charAt(0).toUpperCase() + planName.slice(1)} (${planPrice})</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="color: #666;">Email:</span>
          <span style="font-weight: bold;">${data.customerEmail}</span>
        </div>
        ${data.isFoundingMember ? `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e9ecef;">
          <span style="color: #666;">Zakladatelský člen:</span>
          <span style="font-weight: bold; color: #FFD700;">✨ Ano - cena uzamčena navždy!</span>
        </div>
        ` : ''}
      </div>

      <!-- Benefits -->
      <div style="margin: 30px 0;">
        <h3 style="color: #25D366; font-size: 18px; margin: 0 0 20px 0;">
          ✨ Co vám DokladBot umožní:
        </h3>
        <div style="font-size: 15px; line-height: 1.6; color: #333;">
          <div style="margin-bottom: 10px;">✅ Jednoduché evidování příjmů a výdajů přes WhatsApp</div>
          <div style="margin-bottom: 10px;">✅ AI kategorizace všech transakcí</div>
          <div style="margin-bottom: 10px;">✅ Automatické připomínky na DPH</div>
          <div style="margin-bottom: 10px;">✅ Měsíční přehledy a výkazy</div>
          <div style="margin-bottom: 10px;">✅ Export dat pro daňového poradce</div>
          <div style="margin-bottom: 10px;">✅ Podpora 7 dní v týdnu</div>
        </div>
      </div>

      <!-- Support -->
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
        <div style="font-size: 16px; color: #333; margin-bottom: 10px;">
          💬 Potřebujete pomoc?
        </div>
        <div style="font-size: 14px; color: #666; line-height: 1.5;">
          Náš tým je tu pro vás! Napište nám na 
          <a href="mailto:info@dokladbot.cz" style="color: #25D366; text-decoration: none; font-weight: bold;">
            info@dokladbot.cz
          </a>
          <br>
          Odpovídáme obvykle do 2 hodin během pracovní doby.
          <br><br>
          <a href="https://dokladbot.cz/spravovat-predplatne" style="color: #1e40af; text-decoration: underline;">
            🔧 Spravovat předplatné (zrušit, změnit kartu, faktury)
          </a>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
      <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
        Těšíme se na spolupráci! 🚀
      </div>
      <div style="font-size: 12px; color: #999; line-height: 1.5;">
        DokladBot<br>
        Praha, Česká republika<br>
        © 2025<br>
        <a href="https://dokladbot.cz" style="color: #25D366; text-decoration: none;">dokladbot.cz</a> | 
        <a href="mailto:info@dokladbot.cz" style="color: #25D366; text-decoration: none;">info@dokladbot.cz</a>
      </div>
    </div>

  </div>
</body>
</html>
  `.trim();
}

export function generateActivationEmailText(data: ActivationEmailData): string {
  const planName = data.plan === 'MONTHLY' ? 'měsíční' : 'roční';
  const planPrice = data.plan === 'MONTHLY' ? '199 Kč/měsíc' : '1990 Kč/rok';
  
  return `
DokladBot - Váš aktivační kód

Děkujeme za nákup, ${data.customerName}!

Vaše platba byla úspěšně zpracována. ${data.isFoundingMember ? 'Gratulujeme, jste zakladatelský člen!' : ''}

🔑 AKTIVAČNÍ KÓD: ${data.activationCode}
⏰ Vyprší: ${data.expiresAt}

📱 JAK AKTIVOVAT:
1. Otevřete WhatsApp
2. Napište na číslo: ${data.whatsappNumber}
3. Pošlete: Aktivace ${data.activationCode}
4. Postupujte podle instrukcí

📋 VAŠE PŘEDPLATNÉ:
- Plán: ${planName.charAt(0).toUpperCase() + planName.slice(1)} (${planPrice})
- Email: ${data.customerEmail}
${data.isFoundingMember ? '- Zakladatelský člen: Cena uzamčena navždy!' : ''}

✨ CO VÁM DOKLADBOT UMOŽNÍ:
✅ Jednoduché evidování přes WhatsApp
✅ AI kategorizace transakcí
✅ Automatické připomínky na DPH
✅ Měsíční přehledy a výkazy
✅ Export pro daňového poradce
✅ Podpora 7 dní v týdnu

💬 POTŘEBUJETE POMOC?
Napište nám na info@dokladbot.cz
Odpovídáme obvykle do 2 hodin.

🔧 SPRAVOVAT PŘEDPLATNÉ:
https://dokladbot.cz/spravovat-predplatne
(zrušit, změnit kartu, stáhnout faktury)

Těšíme se na spolupráci! 🚀

--
DokladBot
Praha, Česká republika
© 2025
dokladbot.cz | info@dokladbot.cz
  `.trim();
}