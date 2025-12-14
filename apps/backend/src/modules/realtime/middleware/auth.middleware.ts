import type { Socket } from 'socket.io'
import { authService } from '@/services/auth.service'
import { logger } from '@/utils/logger'

/**
 * WebSocket Authentication Middleware
 *
 * Validates JWT tokens from Socket.IO handshake and attaches user data to socket.
 * Token can be provided in:
 * - socket.handshake.auth.token
 * - socket.handshake.headers.authorization (Bearer token)
 */
export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    // Extract token from handshake
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(' ')[1]

    if (!token) {
      logger.warn({ socketId: socket.id }, 'WebSocket connection attempt without token')
      return next(new Error('Authentication required'))
    }

    // Verify JWT token
    const payload = authService.verifyAccessToken(token)

    // Attach user data to socket
    socket.data.userId = payload.userId
    socket.data.role = payload.role
    socket.data.isAuthenticated = true

    logger.info(
      { socketId: socket.id, userId: payload.userId, role: payload.role },
      'WebSocket authenticated'
    )

    next()
  } catch (error) {
    logger.error({ error, socketId: socket.id }, 'WebSocket authentication failed')
    next(new Error('Invalid or expired token'))
  }
}

/**
 * Optional Authentication Middleware
 *
 * Allows both authenticated and guest users to connect.
 * Sets isAuthenticated flag based on token validity.
 */
export async function socketOptionalAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(' ')[1]

    if (!token) {
      // Allow guest users
      socket.data.isAuthenticated = false
      socket.data.userId = undefined
      socket.data.role = undefined
      logger.info({ socketId: socket.id }, 'WebSocket connected as guest')
      return next()
    }

    // Verify token if provided
    const payload = authService.verifyAccessToken(token)

    socket.data.userId = payload.userId
    socket.data.role = payload.role
    socket.data.isAuthenticated = true

    logger.info(
      { socketId: socket.id, userId: payload.userId, role: payload.role },
      'WebSocket authenticated'
    )

    next()
  } catch (error) {
    // Invalid token, allow as guest
    socket.data.isAuthenticated = false
    socket.data.userId = undefined
    socket.data.role = undefined
    logger.warn({ error, socketId: socket.id }, 'Invalid token, connecting as guest')
    next()
  }
}
