import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import { logger } from '@/utils/logger'

export async function setupSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Redis Adapter pour multi-instances (optionnel si Redis disponible)
  if (process.env.REDIS_URL) {
    try {
      const pubClient = new Redis(process.env.REDIS_URL)
      const subClient = pubClient.duplicate()

      await Promise.all([pubClient.ping(), subClient.ping()])

      io.adapter(createAdapter(pubClient, subClient))
      logger.info('Socket.IO Redis adapter configured')
    } catch (error) {
      logger.warn(
        { error },
        'Redis not available, Socket.IO will run in single-instance mode'
      )
    }
  } else {
    logger.warn('REDIS_URL not configured, Socket.IO will run in single-instance mode')
  }

  // Metrics
  let connectionCount = 0

  io.on('connection', (socket) => {
    connectionCount++
    logger.info(
      {
        socketId: socket.id,
        totalConnections: connectionCount,
      },
      'Client connected'
    )

    socket.on('disconnect', (reason) => {
      connectionCount--
      logger.info(
        {
          socketId: socket.id,
          reason,
          totalConnections: connectionCount,
        },
        'Client disconnected'
      )
    })
  })

  return io
}
