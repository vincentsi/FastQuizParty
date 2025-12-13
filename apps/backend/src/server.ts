import { env } from '@/config/env'
import { disconnectPrisma } from '@/config/prisma'
import {
  disconnectRedis,
  initializeRedis,
  isRedisAvailable,
} from '@/config/redis'
import { startStripeWebhookWorker } from '@/queues/stripe-webhook.queue'
import { logger } from '@/utils/logger'
import type { FastifyInstance } from 'fastify'
import { createApp } from './app'

/**
 * Server entry point
 * 1. Initialize Redis for caching (optional)
 * 2. Validate environment variables (via env import)
 * 3. Create Fastify app
 * 4. Start listening on PORT
 * 5. Handle graceful shutdown
 */

// Initialize Redis (optional, app works without it)
initializeRedis()

let app: FastifyInstance | null = null

async function start() {
  try {
    // Create app
    app = await createApp()

    // Start server
    const port = Number(env.PORT)
    await app.listen({ port, host: '0.0.0.0' })

    // Start Stripe webhook worker (unless explicitly disabled)
    // Wait a bit for Redis to be ready
    if (process.env.DISABLE_STRIPE_WORKER === 'true') {
      logger.info(
        '⚠️  Stripe webhook worker disabled (DISABLE_STRIPE_WORKER=true)'
      )
    } else {
      setTimeout(() => {
        if (isRedisAvailable()) {
          const worker = startStripeWebhookWorker()
          if (!worker) {
            logger.warn(
              '⚠️  Stripe webhook worker failed to start, webhooks will be processed synchronously'
            )
          }
        } else {
          logger.warn(
            '⚠️  Redis not available, webhooks will be processed synchronously'
          )
        }
      }, 100) // Wait 100ms for Redis to be ready
    }

    logger.info(`🚀 Server ready at http://localhost:${port}`)
    logger.info(`📊 Health check: http://localhost:${port}/api/health`)
    logger.info(`📚 API Docs: http://localhost:${port}/docs`)
  } catch (error) {
    logger.error({ error: error }, '❌ Error starting server:')
    await cleanup()
    process.exit(1)
  }
}

/**
 * Cleanup resources before shutdown
 * Closes server, database, and Redis connections
 */
async function cleanup() {
  try {
    if (app) {
      logger.info('🔌 Closing server...')
      await app.close()
    }

    logger.info('🔌 Closing database connection...')
    await disconnectPrisma()

    logger.info('🔌 Closing Redis connection...')
    await disconnectRedis()

    logger.info('✅ Cleanup complete')
  } catch (error) {
    logger.error({ error: error }, '❌ Error during cleanup:')
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ error: promise }, '❌ Unhandled Promise Rejection at:')
  logger.error({ error: reason }, '❌ Reason:')

  // Don't crash the server, but log the error
  // In production, you might want to crash and restart via PM2/Docker
})

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error({ error: error }, '❌ Uncaught Exception:')

  // Cleanup and exit because app state is uncertain
  cleanup().then(() => {
    logger.error('💥 Server crashed due to uncaught exception, exiting...')
    process.exit(1)
  })
})

// Handle graceful shutdown
const signals = ['SIGINT', 'SIGTERM'] as const
for (const signal of signals) {
  process.on(signal, async () => {
    logger.info(`\n⚠️  Received ${signal}, shutting down gracefully...`)
    await cleanup()
    process.exit(0)
  })
}

// Start server
start()
