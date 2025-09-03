import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppLimitManager } from '@/lib/whatsapp-limits'
import jwt from 'jsonwebtoken'

export interface WhatsAppRateLimitOptions {
  checkType: 'message' | 'document'
  recordUsage?: boolean
  requireAuth?: boolean
}

/**
 * Middleware for enforcing WhatsApp bot rate limits
 * 
 * Usage:
 * const result = await withWhatsAppRateLimit(request, {
 *   checkType: 'message',
 *   recordUsage: true,
 *   requireAuth: true
 * })
 * 
 * if (!result.allowed) {
 *   return NextResponse.json(result.error, { status: result.status })
 * }
 */
export async function withWhatsAppRateLimit(
  request: NextRequest,
  options: WhatsAppRateLimitOptions
): Promise<{
  allowed: boolean
  userId?: string
  error?: any
  status?: number
  remaining?: any
}> {
  try {
    // Extract user ID from token if auth is required
    let userId: string | undefined

    if (options.requireAuth !== false) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          allowed: false,
          error: { error: 'Authorization header required' },
          status: 401
        }
      }

      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        userId = decoded.userId
      } catch (error) {
        return {
          allowed: false,
          error: { error: 'Invalid token' },
          status: 401
        }
      }
    } else {
      // If auth is not required, try to get userId from request body or query
      const url = new URL(request.url)
      userId = url.searchParams.get('userId') || undefined
      
      if (!userId && request.method === 'POST') {
        try {
          const body = await request.json()
          userId = body.userId
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }
    }

    if (!userId) {
      return {
        allowed: false,
        error: { error: 'User ID required' },
        status: 400
      }
    }

    // Check limits based on type
    let checkResult: any

    if (options.checkType === 'message') {
      checkResult = await WhatsAppLimitManager.canSendMessage(userId)
    } else if (options.checkType === 'document') {
      checkResult = await WhatsAppLimitManager.canProcessDocument(userId)
    } else {
      return {
        allowed: false,
        error: { error: 'Invalid check type' },
        status: 400
      }
    }

    if (!checkResult.allowed) {
      return {
        allowed: false,
        error: { 
          error: 'Rate limit exceeded',
          reason: checkResult.reason,
          type: 'whatsapp_limit'
        },
        status: 429
      }
    }

    // Record usage if requested
    if (options.recordUsage) {
      if (options.checkType === 'message') {
        await WhatsAppLimitManager.recordMessageUsage(userId)
      } else if (options.checkType === 'document') {
        await WhatsAppLimitManager.recordDocumentUsage(userId)
      }
    }

    return {
      allowed: true,
      userId,
      remaining: checkResult.remaining
    }
  } catch (error) {
    console.error('WhatsApp rate limit middleware error:', error)
    return {
      allowed: false,
      error: { error: 'Internal server error' },
      status: 500
    }
  }
}

/**
 * Higher-order function to wrap API routes with WhatsApp rate limiting
 */
export function withWhatsAppRateLimitRoute(
  handler: (req: NextRequest, rateLimitData: any) => Promise<NextResponse>,
  options: WhatsAppRateLimitOptions
) {
  return async function (req: NextRequest) {
    const rateLimitResult = await withWhatsAppRateLimit(req, options)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        rateLimitResult.error,
        { status: rateLimitResult.status }
      )
    }

    // Call the original handler with rate limit data
    return handler(req, {
      userId: rateLimitResult.userId,
      remaining: rateLimitResult.remaining
    })
  }
}