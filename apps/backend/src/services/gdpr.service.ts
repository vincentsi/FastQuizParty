import { prisma } from '@/config/prisma'
import { TokenCleanup } from '@/utils/token-cleanup.util'

/**
 * GDPR Compliance Service
 *
 * Implements GDPR/RGPD requirements:
 * - Right to data portability (Article 20)
 * - Right to erasure / "Right to be forgotten" (Article 17)
 *
 * @see https://gdpr.eu/
 */
export class GDPRService {
  /**
   * Export all user data in machine-readable format (JSON)
   *
   * GDPR Article 20: Right to data portability
   * Users have the right to receive their personal data in a structured,
   * commonly used and machine-readable format.
   *
   * @param userId - ID of user requesting data export
   * @returns Complete user data package
   *
   * @example
   * ```typescript
   * const userData = await gdprService.exportUserData(userId)
   * // Returns JSON with all user data
   * ```
   */
  async exportUserData(userId: string): Promise<{
    user: Record<string, unknown>
    metadata: {
      exportDate: string
      dataRetentionNotice: string
    }
    personalData: {
      refreshTokens: Array<{
        createdAt: string
        expiresAt: string
        revoked: boolean
      }>
      verificationTokens: Array<{ createdAt: string; expiresAt: string }>
      resetTokens: Array<{ createdAt: string; expiresAt: string }>
      csrfTokens: Array<{ createdAt: string; expiresAt: string }>
      subscriptions: Array<{
        id: string
        status: string
        planType: string
        currentPeriodStart: string
        currentPeriodEnd: string
        cancelAtPeriodEnd: boolean
        canceledAt: string | null
        createdAt: string
        updatedAt: string
        stripeSubscriptionId: string
        stripePriceId: string
        stripeCustomerId: string
      }>
      hostedGames: Array<{
        id: string
        code: string
        quizId: string
        status: string
        startedAt: string | null
        finishedAt: string | null
        createdAt: string
      }>
      playedGames: Array<{
        gameId: string
        username: string
        score: number
        rank: number | null
        correctAnswers: number
        totalAnswers: number
        joinedAt: string
      }>
      createdQuizzes: Array<{
        id: string
        title: string
        description: string | null
        isPublic: boolean
        isPremium: boolean
        createdAt: string
      }>
      stats: unknown
    }
  }> {
    // Fetch user with all related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        refreshTokens: {
          select: {
            createdAt: true,
            expiresAt: true,
            revoked: true,
          },
        },
        verificationTokens: {
          select: {
            createdAt: true,
            expiresAt: true,
          },
        },
        resetTokens: {
          select: {
            createdAt: true,
            expiresAt: true,
          },
        },
        csrfTokens: {
          select: {
            createdAt: true,
            expiresAt: true,
          },
        },
        subscriptions: {
          select: {
            id: true,
            status: true,
            planType: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            canceledAt: true,
            createdAt: true,
            updatedAt: true,
            stripeSubscriptionId: true,
            stripePriceId: true,
            stripeCustomerId: true,
          },
        },
        hostedGames: {
          select: {
            id: true,
            code: true,
            quizId: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            createdAt: true,
          },
        },
        playedGames: {
          select: {
            gameId: true,
            username: true,
            score: true,
            rank: true,
            correctAnswers: true,
            totalAnswers: true,
            joinedAt: true,
          },
        },
        createdQuizzes: {
          select: {
            id: true,
            title: true,
            description: true,
            isPublic: true,
            isPremium: true,
            createdAt: true,
          },
        },
        stats: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Extract user data without password and relations (relations are in personalData)
    const {
      password: _password,
      refreshTokens: _refreshTokens,
      verificationTokens: _verificationTokens,
      resetTokens: _resetTokens,
      csrfTokens: _csrfTokens,
      subscriptions: _subscriptions,
      hostedGames: _hostedGames,
      playedGames: _playedGames,
      createdQuizzes: _createdQuizzes,
      stats: _stats,
    } = user

    // Convert dates to ISO strings for JSON serialization
    // Build user export object explicitly to ensure proper serialization
    const userExport = {
      id: String(user.id),
      email: String(user.email),
      name: user.name ? String(user.name) : null,
      role: String(user.role),
      emailVerified: Boolean(user.emailVerified),
      stripeCustomerId: user.stripeCustomerId ? String(user.stripeCustomerId) : null,
      subscriptionStatus: String(user.subscriptionStatus),
      subscriptionId: user.subscriptionId ? String(user.subscriptionId) : null,
      planType: String(user.planType),
      lastLoginIp: user.lastLoginIp ? String(user.lastLoginIp) : null,
      loginCount: Number(user.loginCount),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      currentPeriodEnd: user.currentPeriodEnd
        ? user.currentPeriodEnd.toISOString()
        : null,
    }

    return {
      user: userExport,
      metadata: {
        exportDate: new Date().toISOString(),
        dataRetentionNotice:
          'This data export contains all personal information we store about you. ' +
          'You have the right to request deletion of this data at any time.',
      },
      personalData: {
        refreshTokens: user.refreshTokens.map(t => ({
          createdAt: t.createdAt.toISOString(),
          expiresAt: t.expiresAt.toISOString(),
          revoked: Boolean(t.revoked),
        })),
        verificationTokens: user.verificationTokens.map(t => ({
          createdAt: t.createdAt.toISOString(),
          expiresAt: t.expiresAt.toISOString(),
        })),
        resetTokens: user.resetTokens.map(t => ({
          createdAt: t.createdAt.toISOString(),
          expiresAt: t.expiresAt.toISOString(),
        })),
        csrfTokens: user.csrfTokens.map(t => ({
          createdAt: t.createdAt.toISOString(),
          expiresAt: t.expiresAt.toISOString(),
        })),
        subscriptions: user.subscriptions.map(s => ({
          id: String(s.id),
          status: String(s.status),
          planType: String(s.planType),
          currentPeriodStart: s.currentPeriodStart.toISOString(),
          currentPeriodEnd: s.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: Boolean(s.cancelAtPeriodEnd),
          canceledAt: s.canceledAt ? s.canceledAt.toISOString() : null,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          stripeSubscriptionId: String(s.stripeSubscriptionId),
          stripePriceId: String(s.stripePriceId),
          stripeCustomerId: String(s.stripeCustomerId),
        })),
        hostedGames: user.hostedGames.map(g => ({
          id: String(g.id),
          code: String(g.code),
          quizId: String(g.quizId),
          status: String(g.status),
          startedAt: g.startedAt ? g.startedAt.toISOString() : null,
          finishedAt: g.finishedAt ? g.finishedAt.toISOString() : null,
          createdAt: g.createdAt.toISOString(),
        })),
        playedGames: user.playedGames.map(p => ({
          gameId: String(p.gameId),
          username: String(p.username),
          score: Number(p.score),
          rank: p.rank ? Number(p.rank) : null,
          correctAnswers: Number(p.correctAnswers),
          totalAnswers: Number(p.totalAnswers),
          joinedAt: p.joinedAt.toISOString(),
        })),
        createdQuizzes: user.createdQuizzes.map(q => ({
          id: String(q.id),
          title: String(q.title),
          description: q.description ? String(q.description) : null,
          isPublic: Boolean(q.isPublic),
          isPremium: Boolean(q.isPremium),
          createdAt: q.createdAt.toISOString(),
        })),
        stats: user.stats,
      },
    }
  }

  /**
   * Permanently delete all user data (GDPR "Right to be forgotten")
   *
   * GDPR Article 17: Right to erasure
   * Users have the right to have their personal data erased without undue delay.
   *
   * ⚠️ WARNING: This action is IRREVERSIBLE. All user data will be permanently deleted:
   * - User account
   * - All tokens (refresh, verification, reset, CSRF)
   * - Subscription history
   * - Related data in other tables (via CASCADE)
   *
   * Note: Stripe customer data must be deleted separately via Stripe API
   *
   * @param userId - ID of user requesting data deletion
   * @param reason - Optional reason for deletion (for audit log)
   * @returns Deletion confirmation with timestamp
   *
   * @example
   * ```typescript
   * await gdprService.deleteUserData(userId, 'User requested account deletion')
   * // User and all related data permanently deleted
   * ```
   */
  async deleteUserData(
    userId: string,
    _reason?: string
  ): Promise<{
    success: boolean
    deletedAt: string
    message: string
    deletedData: {
      user: boolean
      refreshTokens: number
      verificationTokens: number
      resetTokens: number
      csrfTokens: number
      subscriptions: number
    }
  }> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Count related data before deletion (for confirmation)
    const counts = await Promise.all([
      prisma.refreshToken.count({ where: { userId } }),
      prisma.verificationToken.count({ where: { userId } }),
      prisma.passwordResetToken.count({ where: { userId } }),
      prisma.csrfToken.count({ where: { userId } }),
      prisma.subscription.count({ where: { userId } }),
    ])

    const [
      refreshTokenCount,
      verificationTokenCount,
      resetTokenCount,
      csrfTokenCount,
      subscriptionCount,
    ] = counts

    // Delete user (CASCADE will handle related data)
    await prisma.user.delete({
      where: { id: userId },
    })

    // Note: Stripe customer should be deleted via Stripe API
    // This should be handled separately in the controller
    const stripeNote = user.stripeCustomerId
      ? ` Note: Stripe customer ${user.stripeCustomerId} must be deleted separately via Stripe API.`
      : ''

    return {
      success: true,
      deletedAt: new Date().toISOString(),
      message: `User account and all associated data permanently deleted.${stripeNote}`,
      deletedData: {
        user: true,
        refreshTokens: refreshTokenCount,
        verificationTokens: verificationTokenCount,
        resetTokens: resetTokenCount,
        csrfTokens: csrfTokenCount,
        subscriptions: subscriptionCount,
      },
    }
  }

  /**
   * Anonymize user data (alternative to deletion)
   *
   * For cases where complete deletion is not possible due to legal/accounting requirements,
   * but personal identifiable information (PII) must be removed.
   *
   * This method:
   * - Replaces email with anonymized version
   * - Removes name
   * - Invalidates all tokens
   * - Keeps user ID for referential integrity
   *
   * @param userId - ID of user to anonymize
   * @returns Anonymization confirmation
   *
   * @example
   * ```typescript
   * await gdprService.anonymizeUserData(userId)
   * // Email becomes: "deleted-user-clxxx@anonymous.local"
   * // Name removed
   * // All tokens revoked
   * ```
   */
  async anonymizeUserData(userId: string): Promise<{
    success: boolean
    anonymizedAt: string
    message: string
  }> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Anonymize user data
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-user-${userId}@anonymous.local`,
        name: null,
        emailVerified: false,
      },
    })

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    })

    // Delete all other tokens using TokenCleanup utility
    await TokenCleanup.deleteAllUserTokens(userId)

    return {
      success: true,
      anonymizedAt: new Date().toISOString(),
      message:
        'User data anonymized successfully. Personal identifiable information removed.',
    }
  }
}

export const gdprService = new GDPRService()
