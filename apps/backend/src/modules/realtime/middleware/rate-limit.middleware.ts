import type { Socket } from 'socket.io'
import { logger } from '@/utils/logger'

/**
 * WebSocket Rate Limiting Middleware
 *
 * Prevents abuse by limiting the number of events a socket can send per second.
 * Uses in-memory storage (Map) to track event counts per socket.
 */

interface RateLimitRecord {
  count: number
  resetAt: number
}

// In-memory storage for rate limit tracking
const eventCounts = new Map<string, RateLimitRecord>()

// Cleanup old records every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [socketId, record] of eventCounts.entries()) {
    if (now > record.resetAt) {
      eventCounts.delete(socketId)
    }
  }
}, 5 * 60 * 1000)

/**
 * Rate limit middleware factory
 *
 * @param maxEvents Maximum number of events per window (default: 30)
 * @param windowMs Time window in milliseconds (default: 1000ms = 1 second)
 */
export function createSocketRateLimitMiddleware(
  maxEvents: number = 30,
  windowMs: number = 1000
) {
  return (socket: Socket, next: (err?: Error) => void) => {
    const socketId = socket.id
    const now = Date.now()

    let record = eventCounts.get(socketId)

    if (!record || now > record.resetAt) {
      // Create new record or reset expired one
      record = {
        count: 0,
        resetAt: now + windowMs,
      }
      eventCounts.set(socketId, record)
    }

    record.count++

    if (record.count > maxEvents) {
      logger.warn(
        {
          socketId,
          count: record.count,
          maxEvents,
          userId: socket.data.userId,
        },
        'WebSocket rate limit exceeded'
      )

      return next(new Error('Rate limit exceeded. Please slow down.'))
    }

    next()
  }
}

/**
 * Event-specific rate limiter
 *
 * Tracks rate limits per event type, not globally.
 * Useful for different limits on different events.
 */
export function createEventRateLimiter(
  maxEvents: number = 10,
  windowMs: number = 1000
) {
  const eventCounts = new Map<string, RateLimitRecord>()

  return (eventName: string, socket: Socket): boolean => {
    const key = `${socket.id}:${eventName}`
    const now = Date.now()

    let record = eventCounts.get(key)

    if (!record || now > record.resetAt) {
      record = {
        count: 0,
        resetAt: now + windowMs,
      }
      eventCounts.set(key, record)
    }

    record.count++

    if (record.count > maxEvents) {
      logger.warn(
        {
          socketId: socket.id,
          eventName,
          count: record.count,
          maxEvents,
          userId: socket.data.userId,
        },
        'Event rate limit exceeded'
      )

      socket.emit('error', {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many ${eventName} events. Please slow down.`,
      })

      return false
    }

    return true
  }
}
