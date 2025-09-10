// Simple in-memory store for verification tokens
// In production, this should be replaced with Redis or database storage

interface VerificationToken {
  email: string
  expires: number
}

class VerificationStore {
  private tokens = new Map<string, VerificationToken>()

  set(token: string, data: VerificationToken) {
    this.tokens.set(token, data)
    this.cleanup()
  }

  get(token: string): VerificationToken | undefined {
    const data = this.tokens.get(token)
    if (data && data.expires < Date.now()) {
      this.tokens.delete(token)
      return undefined
    }
    return data
  }

  delete(token: string) {
    this.tokens.delete(token)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, value] of this.tokens.entries()) {
      if (value.expires < now) {
        this.tokens.delete(key)
      }
    }
  }

  // Get stats for debugging
  getStats() {
    this.cleanup()
    return {
      activeTokens: this.tokens.size,
      tokens: Array.from(this.tokens.entries()).map(([token, data]) => ({
        token: token.substring(0, 8) + '...',
        email: data.email,
        expiresIn: Math.max(0, Math.round((data.expires - Date.now()) / 1000))
      }))
    }
  }
}

// Create singleton instance
export const verificationStore = new VerificationStore()