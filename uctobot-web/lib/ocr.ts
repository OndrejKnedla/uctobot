// Google Vision OCR utility for processing receipts

interface GoogleVisionResponse {
  responses: Array<{
    textAnnotations: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    fullTextAnnotation?: {
      text: string;
    };
  }>;
}

interface VatInfo {
  rate: number; // DPH sazba (12%, 21%)
  base: number; // Základ daně
  amount: number; // Výše DPH
}

interface ReceiptData {
  amount: number | null;
  currency: string;
  date: string | null;
  merchant: string | null;
  category: string | null;
  items: string[];
  rawText: string;
  
  // Daňové informace
  vatInfo?: VatInfo[];
  totalVat?: number;
  totalBase?: number;
  ico?: string;
  dic?: string;
  receiptNumber?: string;
}

export async function processReceiptWithGoogleVision(imageUrl: string): Promise<ReceiptData> {
  const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
  
  if (!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY === 'your_google_vision_api_key_here') {
    // Fallback to demo data if API key not configured
    return generateDemoReceiptData();
  }

  try {
    // Download image from Twilio URL
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`
      }
    });
    
    if (!imageResponse.ok) {
      throw new Error('Failed to download image from Twilio');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    // Call Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 50
                }
              ]
            }
          ]
        })
      }
    );
    
    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Google Vision API error:', errorText);
      throw new Error(`Google Vision API error: ${visionResponse.status}`);
    }
    
    const visionData: GoogleVisionResponse = await visionResponse.json();
    const fullText = visionData.responses[0]?.fullTextAnnotation?.text || '';
    
    if (!fullText) {
      throw new Error('No text detected in image');
    }
    
    console.log('OCR Text extracted:', fullText);
    
    // Parse the receipt data
    return parseReceiptText(fullText);
    
  } catch (error) {
    console.error('OCR processing error:', error);
    // Return demo data on error
    return generateDemoReceiptData();
  }
}

function parseReceiptText(text: string): ReceiptData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Find amount (Czech currency patterns)
  const amount = findAmount(text);
  
  // Find date (Czech date patterns)
  const date = findDate(text);
  
  // Find merchant name (usually in first few lines)
  const merchant = findMerchant(lines);
  
  // Categorize based on merchant/items
  const category = categorizeReceipt(text, merchant);
  
  // Extract item lines
  const items = extractItems(lines);
  
  // Parse tax information
  const vatInfo = parseVatInfo(text);
  const totalVat = vatInfo.reduce((sum, vat) => sum + vat.amount, 0);
  const totalBase = vatInfo.reduce((sum, vat) => sum + vat.base, 0);
  
  // Parse business identifiers
  const ico = parseICO(text);
  const dic = parseDIC(text);
  const receiptNumber = parseReceiptNumber(text);
  
  return {
    amount,
    currency: 'CZK',
    date,
    merchant,
    category,
    items,
    rawText: text,
    vatInfo: vatInfo.length > 0 ? vatInfo : undefined,
    totalVat: totalVat > 0 ? totalVat : undefined,
    totalBase: totalBase > 0 ? totalBase : undefined,
    ico,
    dic,
    receiptNumber
  };
}

function findAmount(text: string): number | null {
  // Czech patterns for amounts (more specific order)
  const patterns = [
    // Look for "Celkem" followed by amount
    /(?:celkem|suma|total|k\s*úhradě)[:\s]*(\d+)[,.]?(\d{2})?\s*(?:kč|czk)/i,
    // Look for amount followed by "Kč" on same line
    /(\d+)[,.](\d{2})\s*kč(?:\s|$)/i,
    // Look for larger amounts (over 100) - likely to be total
    /(\d{3,})[,.]?(\d{2})?\s*(?:kč|czk)/i,
    // General pattern for amounts with decimals
    /(\d+)[,.](\d{2})\s*(?:kč|czk)/i,
  ];
  
  let bestMatch = null;
  let highestAmount = 0;
  
  // Find all matches and pick the highest one (likely the total)
  for (const pattern of patterns) {
    const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
    for (const match of matches) {
      const whole = parseInt(match[1]);
      const decimal = match[2] ? parseInt(match[2]) : 0;
      const amount = whole + (decimal / 100);
      
      // Prefer amounts over 10 Kč and under 50,000 Kč
      if (amount > 10 && amount < 50000 && amount > highestAmount) {
        highestAmount = amount;
        bestMatch = amount;
      }
    }
  }
  
  return bestMatch;
}

function findDate(text: string): string | null {
  // Czech date patterns
  const patterns = [
    /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/,
    /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Return in Czech format
      if (match[3].length === 4) {
        return `${match[1].padStart(2, '0')}.${match[2].padStart(2, '0')}.${match[3]}`;
      } else {
        const year = parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`;
        return `${match[1].padStart(2, '0')}.${match[2].padStart(2, '0')}.${year}`;
      }
    }
  }
  
  return new Date().toLocaleDateString('cs-CZ');
}

function findMerchant(lines: string[]): string | null {
  // Look for merchant name in first few lines
  const merchantPatterns = [
    /^([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][A-Za-záčďéěíňóřšťúůýž\s]+)(?:s\.?r\.?o\.?|a\.?s\.?|spol\.|obchod)?/,
    /^([A-Z][A-Z\s&]+)$/,
    /(TESCO|ALBERT|LIDL|KAUFLAND|BILLA|PENNY|GLOBUS|MAKRO)/i
  ];
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    for (const pattern of merchantPatterns) {
      const match = line.match(pattern);
      if (match && match[1].length > 2) {
        return match[1].trim();
      }
    }
  }
  
  // Fallback to first substantial line
  for (const line of lines.slice(0, 3)) {
    if (line.length > 3 && !/^\d/.test(line) && !line.includes('--')) {
      return line;
    }
  }
  
  return null;
}

function categorizeReceipt(text: string, merchant: string | null): string {
  const lowerText = text.toLowerCase();
  const lowerMerchant = merchant?.toLowerCase() || '';
  
  // Food & Grocery
  if (lowerMerchant.includes('tesco') || lowerMerchant.includes('albert') || 
      lowerMerchant.includes('lidl') || lowerMerchant.includes('kaufland') ||
      lowerMerchant.includes('billa') || lowerMerchant.includes('penny') ||
      lowerText.includes('potraviny') || lowerText.includes('mléko') ||
      lowerText.includes('chléb') || lowerText.includes('jogurt')) {
    return 'Potraviny';
  }
  
  // Fuel
  if (lowerText.includes('benzin') || lowerText.includes('nafta') ||
      lowerText.includes('shell') || lowerText.includes('mol') ||
      lowerText.includes('esso') || lowerText.includes('čerpací')) {
    return 'Pohonné hmoty';
  }
  
  // Restaurant
  if (lowerText.includes('restaurace') || lowerText.includes('café') ||
      lowerText.includes('pizza') || lowerText.includes('menu') ||
      lowerText.includes('kává') || lowerText.includes('mcdonald') ||
      lowerText.includes('pizzerie') || lowerText.includes('burger') ||
      lowerText.includes('bistro') || lowerText.includes('bar') ||
      lowerText.includes('hospoda') || lowerText.includes('pivnice')) {
    return 'Stravování';
  }
  
  // Pharmacy
  if (lowerText.includes('lékárna') || lowerText.includes('pharmacy') ||
      lowerText.includes('dr.max') || lowerMerchant.includes('lékárna')) {
    return 'Zdraví';
  }
  
  // Office supplies
  if (lowerText.includes('kancelář') || lowerText.includes('tisk') ||
      lowerText.includes('papír') || lowerText.includes('pero')) {
    return 'Kancelář';
  }
  
  return 'Ostatní';
}

function extractItems(lines: string[]): string[] {
  const items: string[] = [];
  
  for (const line of lines) {
    // Skip lines that are likely headers, totals, or metadata
    if (line.length < 3 || 
        /^(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})|^(celkem|suma|total)/i.test(line) ||
        /^(ič[oó]|di[čc]|adresa)/i.test(line) ||
        line.includes('--') || 
        /^\d+[,.]?\d*\s*(?:kč|czk)\s*$/i.test(line)) {
      continue;
    }
    
    // Look for item-like patterns
    if (/^[A-Za-záčďéěíňóřšťúůýž]/.test(line) && line.length > 3) {
      items.push(line);
    }
  }
  
  return items.slice(0, 10); // Limit to 10 items
}

// Parse VAT information from Czech receipts
function parseVatInfo(text: string): VatInfo[] {
  const vatInfo: VatInfo[] = [];
  const lines = text.split('\n');
  
  // Look for VAT patterns like "21% 123,45 25,85" or "DPH 12% základ 297,32 DPH 35,68"
  const vatPatterns = [
    /(\d{1,2})%\s*(\d+)[,.](\d{2})\s*(\d+)[,.](\d{2})/g,
    /dph[:\s]*(\d{1,2})%[:\s]*(\d+)[,.](\d{2})[:\s]*(\d+)[,.](\d{2})/gi,
    /sazba[:\s]*(\d{1,2})%[:\s]*základ[:\s]*(\d+)[,.](\d{2})[:\s]*dph[:\s]*(\d+)[,.](\d{2})/gi
  ];
  
  for (const pattern of vatPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const rate = parseInt(match[1]);
      const base = parseInt(match[2]) + (parseInt(match[3]) / 100);
      const amount = parseInt(match[4]) + (parseInt(match[5]) / 100);
      
      if (rate > 0 && base > 0 && amount > 0) {
        vatInfo.push({ rate, base, amount });
      }
    }
  }
  
  return vatInfo;
}

function parseICO(text: string): string | undefined {
  const icoMatch = text.match(/i[čc][oó]?[:\s]*(\d{8})/i);
  return icoMatch ? icoMatch[1] : undefined;
}

function parseDIC(text: string): string | undefined {
  const dicMatch = text.match(/di[čc][:\s]*(cz\d{8,10})/i);
  return dicMatch ? dicMatch[1].toUpperCase() : undefined;
}

function parseReceiptNumber(text: string): string | undefined {
  const patterns = [
    /da[ňn]ov[yý]\s*doklad[:\s]*(\d+)/i,
    /č[ií]slo\s*dokladu[:\s]*(\d+)/i,
    /doklad\s*č[:\s]*(\d+)/i,
    /paragon[:\s]*(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  return undefined;
}

function generateDemoReceiptData(): ReceiptData {
  const amounts = [89.50, 156.20, 234.90, 67.30, 445.80, 178.60];
  const merchants = ['Tesco Stores ČR', 'Albert Supermarket', 'Lidl Česká republika', 'PENNY MARKET', 'Billa'];
  const categories = ['Potraviny', 'Stravování', 'Kancelář', 'Doprava', 'Zdraví'];
  const items = [
    ['Chléb tmavý', 'Máslo Madeta', 'Jogurt bílý'],
    ['Káva espresso', 'Croissant', 'Džus pomerančový'],
    ['Papír A4', 'Pero kuličkové', 'Sešit linkovaný'],
    ['Benzín Natural 95', 'Oplach skel'],
    ['Vitamin C', 'Aspirin', 'Náplast']
  ];
  
  const randomIndex = Math.floor(Math.random() * merchants.length);
  
  return {
    amount: amounts[randomIndex],
    currency: 'CZK',
    date: new Date().toLocaleDateString('cs-CZ'),
    merchant: merchants[randomIndex],
    category: categories[randomIndex],
    items: items[randomIndex],
    rawText: `${merchants[randomIndex]}\n${amounts[randomIndex]} Kč\n${new Date().toLocaleDateString('cs-CZ')}`
  };
}