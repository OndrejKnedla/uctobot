# Twilio WhatsApp Sandbox Setup

## Aktuální Status
✅ Backend běží na: `localhost:8000`
✅ Ngrok tunel: `https://beaec571b3d0.ngrok-free.app`
✅ Webhook endpoint: `/webhook/whatsapp-simple`
✅ Webhook přijímá zprávy od Twilio

## Twilio Console Nastavení

### 1. WhatsApp Sandbox
URL: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

**Webhook URL:** `https://beaec571b3d0.ngrok-free.app/webhook/whatsapp-simple`

### 2. Kontrolní seznam
- [ ] **WHEN A MESSAGE COMES IN**: URL nastavena správně
- [ ] **HTTP Method**: POST (výchozí)
- [ ] **Webhook URL je aktivní**: ngrok běží
- [ ] **Sandbox je připojen**: poslána "join" zpráva
- [ ] **Content-Type**: application/xml (naše odpověď)

## Testování

### Test zprávy pro WhatsApp bot:
1. **"ahoj"** - Welcome zpráva
2. **"test"** - Potvrzení funkčnosti  
3. **"pomoc"** - Nápověda

### Příkazy pro debug:
```bash
# Kontrola ngrok tunelu
curl https://beaec571b3d0.ngrok-free.app/health

# Test webhook lokálně
python scripts/test_twilio_response.py
```

## Možné problémy

### 1. Twilio Sandbox omezení
- Sandbox mode má omezení na odpovědi
- Možná potřebuje schválení před posíláním zpráv

### 2. Webhook Response Format
- Musí být XML format: `<?xml version="1.0" encoding="UTF-8"?><Response><Message>text</Message></Response>`
- Content-Type: `application/xml`

### 3. Časové omezení
- Webhook musí odpovědět do 15 sekund
- Naše odpověď je rychlá (< 1s)

## Řešení

### Pokud bot stále neodpovídá:

1. **Zkontroluj Twilio Console logs:**
   https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

2. **Zkontroluj webhook URL:**
   - Musí být https://
   - Musí být dostupné z internetu
   - Ngrok musí běžet

3. **Test ngrok připojení:**
   ```bash
   curl -X POST https://beaec571b3d0.ngrok-free.app/webhook/whatsapp-simple \
     -d "From=whatsapp:+420123456789" \
     -d "Body=test"
   ```

4. **Alternativní webhook URL:**
   Zkus původní endpoint: `/webhook/whatsapp` místo `/webhook/whatsapp-simple`

## Aktuální server logy
Server správně přijímá zprávy a odesílá XML odpovědi.
Problem není v našem kódu, ale v Twilio konfiguraci nebo omezeních.