import { logger } from '@/utils/logger'

/**
 * ScoringService - Calcul des points et système de scoring
 *
 * Formules de scoring:
 * - Base: Points de la question (1000 par défaut)
 * - Bonus vitesse: Plus rapide = plus de points
 * - Pénalité temps: -50% max si réponse à la dernière seconde
 * - Streak bonus: +10% par réponse correcte consécutive (max +50%)
 */

export interface ScoreCalculation {
  basePoints: number
  timeBonus: number
  streakBonus: number
  totalPoints: number
  timeFactor: number
}

export class ScoringService {
  /**
   * Calculer les points pour une réponse
   *
   * @param timeMs Temps de réponse en millisecondes
   * @param maxTime Temps maximum alloué en millisecondes
   * @param basePoints Points de base de la question
   * @param isCorrect Si la réponse est correcte
   * @param streak Nombre de réponses correctes consécutives
   * @returns Points gagnés
   */
  calculatePoints(
    timeMs: number,
    maxTime: number,
    basePoints: number,
    isCorrect: boolean,
    streak: number = 0
  ): ScoreCalculation {
    if (!isCorrect) {
      return {
        basePoints: 0,
        timeBonus: 0,
        streakBonus: 0,
        totalPoints: 0,
        timeFactor: 0,
      }
    }

    // Facteur temps: 0 (instantané) à 1 (temps max)
    const timeFactor = Math.max(0, Math.min(1, timeMs / maxTime))

    // Bonus de vitesse: 100% à 50% des points de base
    // Réponse instantanée = 100% des points
    // Réponse à la fin = 50% des points
    const timeMultiplier = 1 - timeFactor * 0.5
    const timeBonus = Math.round(basePoints * timeMultiplier) - basePoints

    // Bonus de streak: +10% par réponse correcte (max +50%)
    const streakMultiplier = Math.min(0.5, streak * 0.1)
    const streakBonus = Math.round(basePoints * streakMultiplier)

    // Total
    const totalPoints = basePoints + timeBonus + streakBonus

    return {
      basePoints,
      timeBonus,
      streakBonus,
      totalPoints,
      timeFactor,
    }
  }

  /**
   * Calculer le streak d'un joueur
   */
  calculateStreak(
    recentAnswers: Array<{ isCorrect: boolean }>,
    maxStreak: number = 5
  ): number {
    let streak = 0

    // Compter les réponses correctes consécutives (en partant de la fin)
    for (let i = recentAnswers.length - 1; i >= 0; i--) {
      const answer = recentAnswers[i]
      if (answer && answer.isCorrect) {
        streak++
        if (streak >= maxStreak) break
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Calculer l'accuracy d'un joueur
   */
  calculateAccuracy(
    correctAnswers: number,
    totalAnswers: number
  ): number {
    if (totalAnswers === 0) return 0
    return Math.round((correctAnswers / totalAnswers) * 100)
  }

  /**
   * Calculer le temps moyen de réponse
   */
  calculateAverageTime(
    answers: Array<{ timeMs: number }>
  ): number {
    if (answers.length === 0) return 0
    const total = answers.reduce((sum, a) => sum + a.timeMs, 0)
    return Math.round(total / answers.length)
  }

  /**
   * Déterminer le rang en fonction du score
   */
  getRank(
    playerScore: number,
    allScores: number[]
  ): number {
    const sorted = [...allScores].sort((a, b) => b - a)
    return sorted.indexOf(playerScore) + 1
  }

  /**
   * Calculer les statistiques finales d'une partie
   */
  calculateFinalStats(
    answers: Array<{ isCorrect: boolean; timeMs: number; points: number }>
  ) {
    const correctAnswers = answers.filter((a) => a.isCorrect).length
    const totalAnswers = answers.length
    const totalPoints = answers.reduce((sum, a) => sum + a.points, 0)
    const averageTime = this.calculateAverageTime(answers)
    const accuracy = this.calculateAccuracy(correctAnswers, totalAnswers)
    const maxStreak = this.calculateMaxStreak(answers)

    return {
      correctAnswers,
      totalAnswers,
      totalPoints,
      averageTime,
      accuracy,
      maxStreak,
    }
  }

  /**
   * Calculer le streak maximum atteint
   */
  private calculateMaxStreak(
    answers: Array<{ isCorrect: boolean }>
  ): number {
    let maxStreak = 0
    let currentStreak = 0

    for (const answer of answers) {
      if (answer.isCorrect) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    return maxStreak
  }

  /**
   * Log des calculs de scoring (pour debug)
   */
  logScoreCalculation(
    playerId: string,
    calculation: ScoreCalculation,
    timeMs: number,
    maxTime: number
  ): void {
    logger.debug(
      {
        playerId,
        timeMs,
        maxTime,
        timeFactor: calculation.timeFactor.toFixed(2),
        basePoints: calculation.basePoints,
        timeBonus: calculation.timeBonus,
        streakBonus: calculation.streakBonus,
        totalPoints: calculation.totalPoints,
      },
      'Score calculation'
    )
  }
}

export const scoringService = new ScoringService()
