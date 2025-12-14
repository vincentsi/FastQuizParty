import type { Socket } from 'socket.io'
import type { z } from 'zod'
import { logger } from '@/utils/logger'

/**
 * WebSocket Event Validation Middleware
 *
 * Validates Socket.IO event payloads using Zod schemas.
 * Returns validated data or emits error to client.
 */

/**
 * Validate Socket.IO event data with Zod schema
 *
 * @param schema Zod schema to validate against
 * @returns Validation function that attaches validated data to socket.data.validatedData
 */
export function validateSocketEvent<T extends z.ZodSchema>(schema: T) {
  return (socket: Socket, data: unknown): z.infer<T> | null => {
    try {
      const validated = schema.parse(data)
      return validated as z.infer<T>
    } catch (error) {
      logger.warn(
        {
          error,
          socketId: socket.id,
          userId: socket.data.userId,
          data,
        },
        'WebSocket event validation failed'
      )

      socket.emit('error', {
        code: 'VALIDATION_ERROR',
        message: 'Invalid event data format',
        details: error instanceof Error ? error.message : 'Unknown validation error',
      })

      return null
    }
  }
}

/**
 * Async validation wrapper
 *
 * For handlers that need async validation (e.g., checking database constraints)
 */
export function validateSocketEventAsync<T extends z.ZodSchema>(schema: T) {
  return async (socket: Socket, data: unknown): Promise<z.infer<T> | null> => {
    try {
      const validated = await schema.parseAsync(data)
      return validated as z.infer<T>
    } catch (error) {
      logger.warn(
        {
          error,
          socketId: socket.id,
          userId: socket.data.userId,
          data,
        },
        'WebSocket event validation failed (async)'
      )

      socket.emit('error', {
        code: 'VALIDATION_ERROR',
        message: 'Invalid event data format',
        details: error instanceof Error ? error.message : 'Unknown validation error',
      })

      return null
    }
  }
}

/**
 * Require authentication for event handler
 *
 * Checks if socket is authenticated before allowing event to proceed
 */
export function requireAuth(socket: Socket): boolean {
  if (!socket.data.isAuthenticated || !socket.data.userId) {
    logger.warn(
      {
        socketId: socket.id,
      },
      'Unauthenticated socket attempted protected event'
    )

    socket.emit('error', {
      code: 'AUTHENTICATION_REQUIRED',
      message: 'You must be authenticated to perform this action',
    })

    return false
  }

  return true
}

/**
 * Require specific role for event handler
 *
 * @param socket Socket instance
 * @param requiredRoles Array of allowed roles
 */
export function requireRole(socket: Socket, requiredRoles: string[]): boolean {
  if (!requireAuth(socket)) {
    return false
  }

  const userRole = socket.data.role

  if (!requiredRoles.includes(userRole)) {
    logger.warn(
      {
        socketId: socket.id,
        userId: socket.data.userId,
        userRole,
        requiredRoles,
      },
      'Unauthorized socket event attempt'
    )

    socket.emit('error', {
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action',
    })

    return false
  }

  return true
}
