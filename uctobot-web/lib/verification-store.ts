// File-based persistent storage for verification tokens
// This ensures tokens persist across API endpoint calls in production

import fs from 'fs'
import path from 'path'

interface VerificationToken {
  email: string
  expires: number
}

interface TokensData {
  [token: string]: VerificationToken
}

class VerificationStore {
  private tokensFile: string

  constructor() {
    // Use /tmp in production (Vercel) or local .tokens file in development
    this.tokensFile = process.env.NODE_ENV === 'production' 
      ? '/tmp/verification-tokens.json'
      : path.join(process.cwd(), '.tokens.json')
  }

  private readTokens(): TokensData {
    try {
      if (fs.existsSync(this.tokensFile)) {
        const data = fs.readFileSync(this.tokensFile, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading tokens file:', error)
    }
    return {}
  }

  private writeTokens(tokens: TokensData) {
    try {
      fs.writeFileSync(this.tokensFile, JSON.stringify(tokens, null, 2))
    } catch (error) {
      console.error('Error writing tokens file:', error)
    }
  }

  private cleanup() {
    const tokens = this.readTokens()
    const now = Date.now()
    let changed = false
    
    for (const [token, data] of Object.entries(tokens)) {
      if (data.expires < now) {
        delete tokens[token]
        changed = true
      }
    }
    
    if (changed) {
      this.writeTokens(tokens)
    }
  }

  set(token: string, data: VerificationToken) {
    const tokens = this.readTokens()
    tokens[token] = data
    this.writeTokens(tokens)
    this.cleanup()
  }

  get(token: string): VerificationToken | undefined {
    const tokens = this.readTokens()
    const data = tokens[token]
    
    if (data && data.expires < Date.now()) {
      // Token expired, delete it
      delete tokens[token]
      this.writeTokens(tokens)
      return undefined
    }
    
    return data
  }

  delete(token: string) {
    const tokens = this.readTokens()
    if (tokens[token]) {
      delete tokens[token]
      this.writeTokens(tokens)
    }
  }

  // Get stats for debugging
  getStats() {
    this.cleanup()
    const tokens = this.readTokens()
    return {
      activeTokens: Object.keys(tokens).length,
      tokens: Object.entries(tokens).map(([token, data]) => ({
        token: token.substring(0, 8) + '...',
        email: data.email,
        expiresIn: Math.max(0, Math.round((data.expires - Date.now()) / 1000))
      }))
    }
  }
}

// Create singleton instance
export const verificationStore = new VerificationStore()