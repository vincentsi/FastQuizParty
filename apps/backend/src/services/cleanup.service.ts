import { prisma } from '@/config/prisma'
import { logger } from '@/utils/logger'
import type { FastifyInstance } from 'fastify'

/**
 * Token Cleanup Service
 *
 * Manual cleanup of expired tokens with batching:
 * - Batched deletion (configurable batch size, prevents long DB locks)
 * - Pause between batches (configurable, prevents CPU/DB overload)
 * - Cleans 4 token types: Refresh, Verification, PasswordReset, CSRF
 *
 * @example
 * ```typescript
 * // Manual cleanup (admin endpoint)
 * await CleanupService.runManualCleanup(app)
 * ```
 */
export class CleanupService {
  /**
   * Batch size configurable via environment
   * Default: 1000 tokens per batch
   */
  private static readonly BATCH_SIZE =
    Number(process.env.CLEANUP_BATCH_SIZE) || 1000

  /**
   * Pause between batches configurable via environment (in ms)
   * Default: 100ms
   */
  private static readonly PAUSE_BETWEEN_BATCHES =
    Number(process.env.CLEANUP_PAUSE_MS) || 100

  /**
   * Deletes all expired tokens from database
   * - Expired RefreshTokens
   * - Expired VerificationTokens
   * - Expired PasswordResetTokens
   * - Expired CsrfTokens
   *
   * Optimized with configurable batching to avoid prolonged database locks
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date()

    try {
      const deletedRefreshTokens = await this.cleanupModelWithBatching(
        'refresh tokens',
        prisma.refreshToken,
        now,
        this.BATCH_SIZE
      )

      const deletedVerificationTokens = await this.cleanupModelWithBatching(
        'verification tokens',
        prisma.verificationToken,
        now,
        this.BATCH_SIZE
      )

      const deletedResetTokens = await this.cleanupModelWithBatching(
        'password reset tokens',
        prisma.passwordResetToken,
        now,
        this.BATCH_SIZE
      )

      const deletedCsrfTokens = await this.cleanupModelWithBatching(
        'CSRF tokens',
        prisma.csrfToken,
        now,
        this.BATCH_SIZE
      )

      logger.info(
        `✅ Cleanup completed: ${deletedRefreshTokens} refresh tokens, ${deletedVerificationTokens} verification tokens, ${deletedResetTokens} reset tokens, ${deletedCsrfTokens} CSRF tokens deleted`
      )
    } catch (error) {
      logger.error({ error: error }, '❌ Error during token cleanup:')
    }
  }

  /**
   * Cleans up a specific model in batches
   * Solution: Find IDs first, then delete by IDs (Prisma doesn't support `take` on deleteMany)
   *
   * @param _modelName - Model name for logging (currently unused)
   * @param model - Prisma model to clean up
   * @param now - Current date
   * @param batchSize - Batch size
   * @returns Total number of tokens deleted
   */
  private static async cleanupModelWithBatching(
    _modelName: string,
    model: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    now: Date,
    batchSize: number
  ): Promise<number> {
    let totalDeleted = 0
    let hasMore = true

    while (hasMore) {
      const tokensToDelete = await model.findMany({
        where: {
          expiresAt: { lt: now },
        },
        select: { id: true },
        take: batchSize,
      })

      if (tokensToDelete.length === 0) {
        hasMore = false
        break
      }

      const result = await model.deleteMany({
        where: {
          id: { in: tokensToDelete.map((t: { id: string }) => t.id) },
        },
      })

      totalDeleted += result.count

      if (tokensToDelete.length < batchSize) {
        hasMore = false
      }

      if (hasMore) {
        await new Promise(resolve =>
          setTimeout(resolve, CleanupService.PAUSE_BETWEEN_BATCHES)
        )
      }
    }

    return totalDeleted
  }

  /**
   * Runs manual cleanup of expired tokens
   * Call this from admin endpoint or manually when needed
   */
  static async runManualCleanup(app: FastifyInstance): Promise<void> {
    app.log.info('Running manual token cleanup...')
    await CleanupService.cleanupExpiredTokens()
  }
}
