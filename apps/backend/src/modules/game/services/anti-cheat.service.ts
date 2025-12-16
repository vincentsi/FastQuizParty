import { logger } from '@/utils/logger'

/**
 * AntiCheatService - Détection basique de triche
 *
 * Mesures anti-triche:
 * 1. Validation timestamp: Réponse avant question = invalide
 * 2. Temps minimum: < 500ms = suspect (humainement difficile)
 * 3. Temps maximum: > timeLimit = invalide
 * 4. Pattern détection: Trop régulier = bot potentiel
 * 5. Score serveur-side: Le serveur calcule les points, pas le client
 */

export interface AntiCheatResult {
  isValid: boolean
  reason?: string
  isSuspicious: boolean
  suspicionReasons: string[]
}

export interface PlayerAnswerPattern {
  playerId: string
  answers: Array<{
    timeMs: number
    isCorrect: boolean
    timestamp: number
  }>
}

export class AntiCheatService {
  private readonly MIN_HUMAN_TIME = 500 // 500ms minimum (réaction humaine)
  private readonly TIME_TOLERANCE = 100 // 100ms de tolérance réseau
  private readonly PERFECT_ACCURACY_THRESHOLD = 0.95 // 95%+ suspect
  private readonly TIME_VARIANCE_THRESHOLD = 200 // Variance < 200ms suspect

  /**
   * Valider une réponse
   */
  validateAnswer(
    timestamp: number,
    questionStartTime: number,
    timeLimit: number
  ): AntiCheatResult {
    const timeMs = timestamp - questionStartTime
    const maxTime = timeLimit * 1000 + this.TIME_TOLERANCE

    const suspicionReasons: string[] = []

    // 1. Réponse avant la question
    if (timeMs < 0) {
      return {
        isValid: false,
        reason: 'Answer submitted before question was sent',
        isSuspicious: true,
        suspicionReasons: ['negative_time'],
      }
    }

    // 2. Réponse après le temps limite
    if (timeMs > maxTime) {
      return {
        isValid: false,
        reason: 'Answer submitted after time limit',
        isSuspicious: false,
        suspicionReasons: [],
      }
    }

    // 3. Réponse trop rapide (suspect mais pas invalide)
    if (timeMs < this.MIN_HUMAN_TIME) {
      suspicionReasons.push('too_fast')
      logger.warn(
        {
          timeMs,
          minTime: this.MIN_HUMAN_TIME,
        },
        'Suspiciously fast answer'
      )
    }

    return {
      isValid: true,
      isSuspicious: suspicionReasons.length > 0,
      suspicionReasons,
    }
  }

  /**
   * Détecter les patterns suspects
   */
  detectSuspiciousPattern(pattern: PlayerAnswerPattern): AntiCheatResult {
    const suspicionReasons: string[] = []
    const { answers } = pattern

    if (answers.length < 3) {
      // Pas assez de données
      return {
        isValid: true,
        isSuspicious: false,
        suspicionReasons: [],
      }
    }

    // 1. Accuracy trop élevée avec temps très rapides
    const correctCount = answers.filter((a) => a.isCorrect).length
    const accuracy = correctCount / answers.length

    if (accuracy >= this.PERFECT_ACCURACY_THRESHOLD) {
      const avgTime = answers.reduce((sum, a) => sum + a.timeMs, 0) / answers.length

      if (avgTime < this.MIN_HUMAN_TIME * 1.5) {
        suspicionReasons.push('perfect_accuracy_fast_time')
        logger.warn(
          {
            playerId: pattern.playerId,
            accuracy,
            avgTime,
          },
          'Suspicious pattern: Perfect accuracy with fast times'
        )
      }
    }

    // 2. Temps de réponse trop réguliers (bot pattern)
    const times = answers.map((a) => a.timeMs)
    const variance = this.calculateVariance(times)

    if (variance < this.TIME_VARIANCE_THRESHOLD && answers.length >= 5) {
      suspicionReasons.push('too_regular')
      logger.warn(
        {
          playerId: pattern.playerId,
          variance,
          threshold: this.TIME_VARIANCE_THRESHOLD,
        },
        'Suspicious pattern: Too regular timing'
      )
    }

    // 3. Toutes les réponses à la même vitesse (~500ms)
    const allFast = times.every((t) => t < this.MIN_HUMAN_TIME * 1.2)
    if (allFast && times.length >= 5) {
      suspicionReasons.push('all_minimal_time')
      logger.warn(
        {
          playerId: pattern.playerId,
          times,
        },
        'Suspicious pattern: All answers at minimal time'
      )
    }

    return {
      isValid: true, // On n'invalide pas automatiquement
      isSuspicious: suspicionReasons.length > 0,
      suspicionReasons,
    }
  }

  /**
   * Calculer la variance des temps de réponse
   */
  private calculateVariance(times: number[]): number {
    if (times.length === 0) return 0

    const mean = times.reduce((sum, t) => sum + t, 0) / times.length
    const squaredDiffs = times.map((t) => Math.pow(t - mean, 2))
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / times.length

    return Math.sqrt(variance) // Standard deviation
  }

  /**
   * Vérifier si un joueur est suspect
   */
  isPlayerSuspicious(pattern: PlayerAnswerPattern): boolean {
    const result = this.detectSuspiciousPattern(pattern)
    return result.isSuspicious
  }

  /**
   * Logger un joueur suspect pour review manuel
   */
  logSuspiciousPlayer(
    pattern: PlayerAnswerPattern,
    result: AntiCheatResult
  ): void {
    logger.warn(
      {
        playerId: pattern.playerId,
        answerCount: pattern.answers.length,
        suspicionReasons: result.suspicionReasons,
        accuracy: this.calculateAccuracy(pattern.answers),
        avgTime: this.calculateAverageTime(pattern.answers),
      },
      'Suspicious player detected - Manual review recommended'
    )
  }

  /**
   * Calculer l'accuracy
   */
  private calculateAccuracy(
    answers: Array<{ isCorrect: boolean }>
  ): number {
    if (answers.length === 0) return 0
    const correct = answers.filter((a) => a.isCorrect).length
    return Math.round((correct / answers.length) * 100)
  }

  /**
   * Calculer le temps moyen
   */
  private calculateAverageTime(
    answers: Array<{ timeMs: number }>
  ): number {
    if (answers.length === 0) return 0
    const total = answers.reduce((sum, a) => sum + a.timeMs, 0)
    return Math.round(total / answers.length)
  }

  /**
   * Sanitize input (éviter injection)
   */
  sanitizeAnswer(answer: unknown): number | null {
    const parsed = Number(answer)

    if (isNaN(parsed) || !Number.isInteger(parsed)) {
      return null
    }

    // Réponse doit être entre 0 et 3 (4 options)
    if (parsed < 0 || parsed > 3) {
      return null
    }

    return parsed
  }
}

export const antiCheatService = new AntiCheatService()
