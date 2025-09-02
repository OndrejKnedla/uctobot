# CookieBot Setup Pro DokladBot

## 🍪 Co je CookieBot?
CookieBot je GDPR compliant řešení pro správu cookies na webových stránkách. Automaticky skenuje cookies a zobrazuje uživatelům banner pro souhlas.

## 📋 Kroky pro nastavení

### 1. Registrace na CookieBot
1. Jděte na [cookiebot.com](https://cookiebot.com)
2. Vytvořte si účet
3. Přidejte doménu `dokladbot.cz`

### 2. Získání Domain Group ID
1. V CookieBot admin panelu najděte "Domain Group ID"
2. Zkopírujte ID (vypadá jako: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 3. Nastavení v aplikaci
Přidejte Domain Group ID do Vercel environment variables:

```bash
# Pro všechna prostředí (production, preview, development)
NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID=your-actual-domain-group-id-here
```

### 4. Vercel Environment Variables
```bash
npx vercel env add NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID production
npx vercel env add NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID preview  
npx vercel env add NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID development
```

### 5. Aktualizujte .env soubory
Nahraďte placeholder v `.env.local` a `.env.production`:
```
NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID=your-actual-domain-group-id-here
```

## 🔧 Implementované funkce

### ✅ CookieBot Script
- Automaticky se načte v `<head>` na všech stránkách
- Server-side rendering pro lepší SEO

### ✅ Cookie Banner
- Automaticky se zobrazí při první návštěvě
- GDPR compliant souhlas
- Možnost upravit nastavení

### ✅ Cookie Declaration
- Detailní přehled na stránce `/cookies`
- Automaticky aktualizovaný seznam cookies
- České lokalizace

## 🎨 Stylování
CookieBot banner můžete stylovat v CookieBot admin panelu:
1. Jděte do "Settings" → "Banner Design" 
2. Nastavte barvy podle DokladBot brandingu:
   - Primární barva: #22c55e (zelená)
   - Sekundární barva: #ffffff (bílá)
   - Text: #1f2937 (tmavě šedá)

## 📱 Testování
Po nastavení:
1. Otevřete web v incognito režimu
2. Měl by se zobrazit CookieBot banner
3. Zkuste různé možnosti souhlasu
4. Zkontrolujte stránku `/cookies` pro deklaraci

## 🔍 Debug
Pokud se banner nezobrazuje:
1. Zkontrolujte console v prohlížeči
2. Ověřte, že Domain Group ID je správné
3. Zkontrolujte, že doména je přidána v CookieBot admin

## 📊 Analytics
CookieBot poskytuje statistiky:
- Kolik uživatelů souhlasí s cookies
- Jaké kategorie cookies jsou nejčastější
- Geografické rozložení souhlasů

## 💡 Tipy
1. **Pravidelně kontrolujte** - CookieBot automaticky skenuje nové cookies
2. **Aktualizujte texty** - Upravte texty banneru pro lepší konverzi
3. **Sledujte statistiky** - Používejte data pro optimalizaci

---
**Kontakt:** Pokud potřebujete pomoc s nastavením, napište na info@dokladbot.cz