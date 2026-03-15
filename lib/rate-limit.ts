import { NextResponse } from 'next/server'

/**
 * In-memory sliding window rate limiter
 * Compatible with serverless (no Redis dependency)
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number // in milliseconds
}

interface RequestRecord {
  count: number
  resetTime: number
}

type RateLimitPreset = 'auth-strict' | 'payment' | 'social' | 'ai-validation' | 'general'

const presets: Record<RateLimitPreset, RateLimitConfig> = {
  'auth-strict': {
    maxRequests: 5,
    windowMs: 60 * 1000 // 1 minute
  },
  'payment': {
    maxRequests: 10,
    windowMs: 60 * 1000 // 1 minute
  },
  'social': {
    maxRequests: 20,
    windowMs: 60 * 1000 // 1 minute
  },
  'ai-validation': {
    maxRequests: 5,
    windowMs: 60 * 1000 // 1 minute
  },
  'general': {
    maxRequests: 30,
    windowMs: 60 * 1000 // 1 minute
  }
}

// Storage for rate limit data
// In production with multiple instances, you'd use Redis
// This is suitable for serverless with reasonable traffic
const rateLimitStore = new Map<string, RequestRecord>()

// Cleanup old entries every 5 minutes to prevent memory leaks
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Check rate limit for a given key (usually userId or IP)
 */
export function checkRateLimit(
  key: string,
  preset: RateLimitPreset = 'general'
): RateLimitResult {
  const config = presets[preset]
  const now = Date.now()

  let record = rateLimitStore.get(key)

  // If no record or window expired, create new one
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + config.windowMs
    }
    rateLimitStore.set(key, record)
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: record.resetTime
    }
  }

  // Increment counter
  record.count++

  if (record.count > config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter
    }
  }

  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime
  }
}

/**
 * Get rate limit status without incrementing counter
 */
export function getRateLimitStatus(
  key: string,
  preset: RateLimitPreset = 'general'
): RateLimitResult {
  const config = presets[preset]
  const now = Date.now()

  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    return {
      success: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs
    }
  }

  const remaining = Math.max(0, config.maxRequests - record.count)
  return {
    success: remaining > 0,
    remaining,
    resetTime: record.resetTime,
    retryAfter: remaining === 0 ? Math.ceil((record.resetTime - now) / 1000) : undefined
  }
}

/**
 * Reset rate limit for a key (useful for testing)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

/**
 * Middleware helper - returns 429 response when rate limited
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse | null {
  if (result.success) {
    return null
  }

  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter
    },
    { status: 429 }
  )

  // Add rate limit headers
  if (result.retryAfter) {
    response.headers.set('Retry-After', String(result.retryAfter))
  }
  response.headers.set('X-RateLimit-Limit', '5')
  response.headers.set('X-RateLimit-Remaining', '0')
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)))

  return response
}

/**
 * Helper to extract IP from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
  return ip.trim()
}
