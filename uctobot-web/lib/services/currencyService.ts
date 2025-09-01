/**
 * Currency Service for ČNB (Czech National Bank) API integration
 * Converts foreign currencies to CZK using official exchange rates
 */

interface ExchangeRate {
  country: string
  currency: string
  amount: number
  code: string
  rate: number
}

interface CurrencyConversion {
  originalAmount: number
  originalCurrency: string
  convertedAmount: number
  convertedCurrency: string
  exchangeRate: number
  date: string
}

export class CurrencyService {
  
  private static readonly CNB_API_URL = 'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/denni_kurz.txt'
  
  // Cache exchange rates for 1 hour
  private static ratesCache: { rates: Map<string, ExchangeRate>, timestamp: number } | null = null
  private static readonly CACHE_DURATION = 60 * 60 * 1000 // 1 hour
  
  /**
   * Detect currency in text message
   */
  static detectCurrency(text: string): { amount: number, currency: string } | null {
    // Remove 'faktura' and clean text
    const cleanText = text.replace(/faktura/i, '').trim()
    
    // Patterns for different currency formats
    const patterns = [
      // "200 euro", "200 eur", "200 EUR" 
      /(\d+(?:\.\d+)?)\s*(euro?|eur)/i,
      // "200€", "€200"
      /(?:€(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)€)/i,
      // "200 usd", "200 USD", "200 dollar", "200 dolar"
      /(\d+(?:\.\d+)?)\s*(usd|dollar?|dolar)/i,
      // "$200", "200$"
      /(?:\$(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\$)/i,
      // "200 gbp", "200 libr"
      /(\d+(?:\.\d+)?)\s*(gbp|libr[ay]?)/i,
      // "£200", "200£"
      /(?:£(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)£)/i,
      // Standard Czech - "200 kc", "200 czk", "200 korun"
      /(\d+(?:\.\d+)?)\s*(kc|czk|korun?)/i,
      // Just number with no currency - assume CZK
      /^(\d+(?:\.\d+)?)(?:\s|$)/
    ]
    
    for (const pattern of patterns) {
      const match = cleanText.match(pattern)
      if (match) {
        // Extract amount from different capture groups
        const amount = parseFloat(match[1] || match[2] || match[3] || '0')
        if (amount > 0) {
          // Determine currency
          const currencyText = (match[2] || match[0]).toLowerCase()
          
          if (currencyText.includes('eur') || currencyText.includes('€')) {
            return { amount, currency: 'EUR' }
          } else if (currencyText.includes('usd') || currencyText.includes('dollar') || currencyText.includes('dolar') || currencyText.includes('$')) {
            return { amount, currency: 'USD' }
          } else if (currencyText.includes('gbp') || currencyText.includes('libr') || currencyText.includes('£')) {
            return { amount, currency: 'GBP' }
          } else {
            // Default to CZK for KC, CZK, korun, or plain numbers
            return { amount, currency: 'CZK' }
          }
        }
      }
    }
    
    return null
  }
  
  /**
   * Convert amount from source currency to CZK
   */
  static async convertToCZK(amount: number, fromCurrency: string): Promise<CurrencyConversion> {
    // If already CZK, no conversion needed
    if (fromCurrency === 'CZK') {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: 'CZK',
        exchangeRate: 1,
        date: new Date().toISOString().split('T')[0]
      }
    }
    
    try {
      const rates = await this.getExchangeRates()
      const rate = rates.get(fromCurrency)
      
      if (!rate) {
        console.warn(`Exchange rate not found for ${fromCurrency}, using fallback rates`)
        // Fallback rates (approximate)
        const fallbackRates: { [key: string]: number } = {
          'EUR': 25.0,
          'USD': 23.0,
          'GBP': 29.0
        }
        
        const fallbackRate = fallbackRates[fromCurrency]
        if (fallbackRate) {
          const convertedAmount = Math.round(amount * fallbackRate * 100) / 100
          return {
            originalAmount: amount,
            originalCurrency: fromCurrency,
            convertedAmount,
            convertedCurrency: 'CZK',
            exchangeRate: fallbackRate,
            date: new Date().toISOString().split('T')[0] + ' (fallback)'
          }
        } else {
          throw new Error(`Unsupported currency: ${fromCurrency}`)
        }
      }
      
      // ČNB provides rates as: 1 foreign unit = X CZK
      // For currencies like EUR where amount=1, rate is direct
      // For currencies like JPY where amount=100, we need to divide
      const exchangeRate = rate.rate / rate.amount
      const convertedAmount = Math.round(amount * exchangeRate * 100) / 100
      
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount,
        convertedCurrency: 'CZK',
        exchangeRate,
        date: new Date().toISOString().split('T')[0]
      }
      
    } catch (error) {
      console.error('Currency conversion failed:', error)
      throw new Error(`Nepodařilo se převést ${fromCurrency} na CZK`)
    }
  }
  
  /**
   * Get exchange rates from ČNB API
   */
  private static async getExchangeRates(): Promise<Map<string, ExchangeRate>> {
    // Check cache first
    if (this.ratesCache && (Date.now() - this.ratesCache.timestamp) < this.CACHE_DURATION) {
      return this.ratesCache.rates
    }
    
    try {
      const response = await fetch(this.CNB_API_URL)
      if (!response.ok) {
        throw new Error(`ČNB API error: ${response.status}`)
      }
      
      const text = await response.text()
      const rates = this.parseExchangeRates(text)
      
      // Cache the rates
      this.ratesCache = {
        rates,
        timestamp: Date.now()
      }
      
      return rates
      
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
      
      // Return cached rates if available, even if expired
      if (this.ratesCache) {
        console.warn('Using expired exchange rate cache')
        return this.ratesCache.rates
      }
      
      throw error
    }
  }
  
  /**
   * Parse ČNB exchange rate text format
   */
  private static parseExchangeRates(text: string): Map<string, ExchangeRate> {
    const rates = new Map<string, ExchangeRate>()
    const lines = text.trim().split('\n')
    
    // Skip header lines (first 2 lines contain date and column headers)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Format: Country|Currency|Amount|Code|Rate
      // Example: EMU|euro|1|EUR|25,445
      const parts = line.split('|')
      if (parts.length >= 5) {
        const country = parts[0]
        const currency = parts[1]
        const amount = parseInt(parts[2]) || 1
        const code = parts[3]
        const rate = parseFloat(parts[4].replace(',', '.')) || 0
        
        if (code && rate > 0) {
          rates.set(code, {
            country,
            currency,
            amount,
            code,
            rate
          })
        }
      }
    }
    
    console.log(`Loaded ${rates.size} exchange rates from ČNB`)
    return rates
  }
  
  /**
   * Format currency for display
   */
  static formatCurrency(amount: number, currency: string): string {
    const formatted = amount.toLocaleString('cs-CZ', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })
    
    switch (currency) {
      case 'CZK':
        return `${formatted} Kč`
      case 'EUR':
        return `€${formatted}`
      case 'USD':
        return `$${formatted}`
      case 'GBP':
        return `£${formatted}`
      default:
        return `${formatted} ${currency}`
    }
  }
}

export default CurrencyService