import { prisma } from '@/config/prisma'
import { getRedis, isRedisAvailable } from '@/config/redis'
import { logger } from '@/utils/logger'
import type { Question } from '@prisma/client'
import { GameStatus } from '@prisma/client'
import type { Room } from '../types/room.types'
import { ScoringService } from './scoring.service'

/**
 * GameService - Gestion du flow de jeu en temps réel
 *
 * Responsabilités:
 * - Démarrer une partie depuis une room
 * - Distribuer les questions
 * - Valider les réponses avec timestamps
 * - Calculer les scores
 * - Sauvegarder les résultats en DB
 */

export interface GameState {
  roomId: string
  roomCode: string
  hostId: string
  hostUserId?: string // User ID of host (undefined for guest hosts)
  quizId: string
  questions: Question[]
  currentQuestionIndex: number
  questionStartTime: number
  playerAnswers: Map<string, PlayerAnswer[]>
  scores: Map<string, number>
  playerUsernames: Map<string, string> // playerId -> username
  status: GameStatus
  startedAt: number
  finishedAt?: number
}

export interface PlayerAnswer {
  questionId: string
  answer: number
  isCorrect: boolean
  timeMs: number
  points: number
  timestamp: number
}

export interface SubmitAnswerResult {
  isCorrect: boolean
  correctAnswer: number
  points: number
  timeMs: number
  newScore: number
  rank: number
}

export class GameService {
  private readonly GAME_TTL = 7200 // 2 heures
  private readonly scoringService = new ScoringService()

  /**
   * Démarrer une partie depuis une room
   */
  async startGame(room: Room): Promise<GameState> {
    // Charger les questions du quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: room.quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!quiz || quiz.questions.length === 0) {
      throw new Error('Quiz not found or has no questions')
    }

    // Trouver le host player pour obtenir son userId
    const hostPlayer = Array.from(room.players.values()).find(p => p.id === room.hostId)

    // Initialiser le game state
    const gameState: GameState = {
      roomId: room.id,
      roomCode: room.code,
      hostId: room.hostId,
      hostUserId: hostPlayer?.userId, // undefined for guest hosts
      quizId: room.quizId,
      questions: quiz.questions,
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      playerAnswers: new Map(),
      scores: new Map(),
      playerUsernames: new Map(),
      status: GameStatus.PLAYING,
      startedAt: Date.now(),
    }

    // Initialiser les scores à 0 pour tous les joueurs
    room.players.forEach(player => {
      gameState.scores.set(player.id, 0)
      gameState.playerAnswers.set(player.id, [])
      gameState.playerUsernames.set(player.id, player.username)
    })

    // Sauvegarder le game state dans Redis
    await this.saveGameState(gameState)

    logger.info(
      {
        roomId: room.id,
        quizId: room.quizId,
        questionCount: quiz.questions.length,
        playerCount: room.players.size,
      },
      'Game started'
    )

    return gameState
  }

  /**
   * Obtenir la question actuelle
   */
  getCurrentQuestion(gameState: GameState): Question | null {
    if (gameState.currentQuestionIndex >= gameState.questions.length) {
      return null
    }
    return gameState.questions[gameState.currentQuestionIndex] ?? null
  }

  /**
   * Avancer à la question suivante
   */
  async nextQuestion(gameState: GameState): Promise<Question | null> {
    gameState.currentQuestionIndex++

    if (gameState.currentQuestionIndex >= gameState.questions.length) {
      // Partie terminée
      return null
    }

    // Reset le timer pour la nouvelle question
    gameState.questionStartTime = Date.now()

    await this.saveGameState(gameState)

    return gameState.questions[gameState.currentQuestionIndex] ?? null
  }

  /**
   * Soumettre une réponse
   */
  async submitAnswer(
    gameState: GameState,
    playerId: string,
    answer: number,
    timestamp: number
  ): Promise<SubmitAnswerResult> {
    const currentQuestion = this.getCurrentQuestion(gameState)

    if (!currentQuestion) {
      throw new Error('No current question')
    }

    // Vérifier si le joueur a déjà répondu
    const playerAnswers = gameState.playerAnswers.get(playerId) || []
    const alreadyAnswered = playerAnswers.some(
      a => a.questionId === currentQuestion.id
    )

    if (alreadyAnswered) {
      throw new Error('Already answered this question')
    }

    // Vérifier la réponse
    const isCorrect = answer === currentQuestion.correctAnswer

    // Calculer le temps de réponse
    const timeMs = timestamp - gameState.questionStartTime

    // Calculer streak + points via ScoringService
    const streak = this.scoringService.calculateStreak(playerAnswers)
    const scoreCalc = this.scoringService.calculatePoints(
      timeMs,
      currentQuestion.timeLimit * 1000,
      currentQuestion.points,
      isCorrect,
      streak
    )
    const points = scoreCalc.totalPoints

    // Enregistrer la réponse
    const playerAnswer: PlayerAnswer = {
      questionId: currentQuestion.id,
      answer,
      isCorrect,
      timeMs,
      points,
      timestamp,
    }

    playerAnswers.push(playerAnswer)
    gameState.playerAnswers.set(playerId, playerAnswers)

    // Mettre à jour le score
    const currentScore = gameState.scores.get(playerId) || 0
    const newScore = currentScore + points
    gameState.scores.set(playerId, newScore)

    // Sauvegarder
    await this.saveGameState(gameState)

    // Calculer le classement
    const rank = this.calculateRank(gameState, playerId)

    logger.info(
      {
        playerId,
        questionId: currentQuestion.id,
        isCorrect,
        timeMs,
        points,
        newScore,
        rank,
      },
      'Answer submitted'
    )

    return {
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      points,
      timeMs,
      newScore,
      rank,
    }
  }

  /**
   * Calculer les points pour une réponse
   * Formule: maxPoints * (1 - (timeMs / maxTime) * 0.5) si correct
   */
  private calculatePoints(
    timeMs: number,
    maxTime: number,
    maxPoints: number,
    isCorrect: boolean
  ): number {
    if (!isCorrect) {
      return 0
    }

    // Bonus de vitesse: plus rapide = plus de points
    // Si réponse instantanée (0ms) = maxPoints
    // Si réponse à la fin (maxTime) = maxPoints * 0.5
    const timeFactor = Math.max(0, Math.min(1, timeMs / maxTime))
    const points = Math.round(maxPoints * (1 - timeFactor * 0.5))

    return points
  }

  /**
   * Calculer le classement d'un joueur
   */
  private calculateRank(gameState: GameState, playerId: string): number {
    const scores = Array.from(gameState.scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])

    return scores.indexOf(playerId) + 1
  }

  /**
   * Obtenir le leaderboard
   */
  getLeaderboard(
    gameState: GameState
  ): Array<{
    playerId: string
    username: string
    score: number
    rank: number
  }> {
    const scores = Array.from(gameState.scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([playerId, score], index) => ({
        playerId,
        username: gameState.playerUsernames.get(playerId) || 'Unknown',
        score,
        rank: index + 1,
      }))

    return scores
  }

  /**
   * Terminer la partie
   */
  async endGame(gameState: GameState): Promise<void> {
    gameState.status = GameStatus.FINISHED
    gameState.finishedAt = Date.now()

    await this.saveGameState(gameState)

    // Sauvegarder en DB (async, pas besoin d'attendre)
    this.saveGameToDatabase(gameState).catch(error => {
      logger.error(
        { error, roomId: gameState.roomId },
        'Failed to save game to database'
      )
    })

    // NOTE: Ne PAS supprimer le gameState immédiatement!
    // Il sera supprimé après l'émission de game:finished dans le handler
    // ou par un TTL Redis si configuré

    logger.info(
      {
        roomId: gameState.roomId,
        duration: gameState.finishedAt - gameState.startedAt,
        playerCount: gameState.scores.size,
      },
      'Game finished'
    )
  }

  /**
   * Sauvegarder le game state dans Redis
   */
  private async saveGameState(gameState: GameState): Promise<void> {
    if (!isRedisAvailable()) {
      logger.warn('Redis not available, game state not persisted')
      return
    }

    const redis = getRedis()
    if (!redis) return

    const key = `game:${gameState.roomId}`

    // Convertir Maps en objets pour JSON
    const serialized = {
      ...gameState,
      playerAnswers: Object.fromEntries(gameState.playerAnswers),
      scores: Object.fromEntries(gameState.scores),
      playerUsernames: Object.fromEntries(gameState.playerUsernames),
    }

    await redis.setex(key, this.GAME_TTL, JSON.stringify(serialized))
  }

  /**
   * Récupérer le game state depuis Redis
   */
  async getGameState(roomId: string): Promise<GameState | null> {
    if (!isRedisAvailable()) {
      return null
    }

    const redis = getRedis()
    if (!redis) return null

    const key = `game:${roomId}`
    const data = await redis.get(key)

    if (!data) {
      return null
    }

    const parsed = JSON.parse(data)

    // Reconvertir les objets en Maps
    return {
      ...parsed,
      playerAnswers: new Map(Object.entries(parsed.playerAnswers)),
      scores: new Map(Object.entries(parsed.scores)),
      playerUsernames: new Map(Object.entries(parsed.playerUsernames || {})),
    }
  }

  /**
   * Supprimer le game state
   */
  async deleteGameState(roomId: string): Promise<void> {
    if (!isRedisAvailable()) {
      return
    }

    const redis = getRedis()
    if (!redis) return

    await redis.del(`game:${roomId}`)
  }

  /**
   * Sauvegarder la partie en base de données
   */
  private async saveGameToDatabase(gameState: GameState): Promise<void> {
    // Skip saving if host is a guest (no userId)
    // The Game.hostId field requires a foreign key to User table
    if (!gameState.hostUserId) {
      logger.info(
        { roomId: gameState.roomId, hostId: gameState.hostId },
        'Skipping database save for guest-hosted game'
      )
      return
    }

    // Créer le record Game
    const game = await prisma.game.create({
      data: {
        code: gameState.roomCode,
        quizId: gameState.quizId,
        hostId: gameState.hostUserId, // Use hostUserId instead of hostId (player ID)
        status: gameState.status,
        totalQuestions: gameState.questions.length,
        startedAt: new Date(gameState.startedAt),
        finishedAt: gameState.finishedAt
          ? new Date(gameState.finishedAt)
          : null,
      },
    })

    // Créer les GamePlayer records
    const gamePlayerPromises = Array.from(gameState.scores.entries()).map(
      async ([playerId, score]) => {
        const answers = gameState.playerAnswers.get(playerId) || []
        const correctAnswers = answers.filter(a => a.isCorrect).length
        const totalAnswers = answers.length
        const username = gameState.playerUsernames.get(playerId) || 'Unknown'

        const gamePlayer = await prisma.gamePlayer.create({
          data: {
            gameId: game.id,
            userId: playerId.startsWith('guest-') ? null : playerId,
            username,
            score,
            correctAnswers,
            totalAnswers,
            rank: this.calculateRank(gameState, playerId),
          },
        })

        // Créer les PlayerAnswer records pour ce joueur
        if (answers.length > 0) {
          await prisma.playerAnswer.createMany({
            data: answers.map(answer => ({
              gamePlayerId: gamePlayer.id,
              questionId: answer.questionId,
              answer: answer.answer,
              isCorrect: answer.isCorrect,
              responseTime: answer.timeMs,
              points: answer.points,
            })),
          })
        }

        return gamePlayer
      }
    )

    const gamePlayers = await Promise.all(gamePlayerPromises)

    logger.info(
      {
        gameId: game.id,
        roomId: gameState.roomId,
        playerCount: gamePlayers.length,
      },
      'Game saved to database'
    )
  }

  /**
   * Récupérer les résultats d'un game depuis la DB
   */
  async getGameResults(gameId: string): Promise<{
    leaderboard: Array<{
      playerId: string
      username: string
      score: number
      rank: number
    }>
    duration: number
  } | null> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          orderBy: { score: 'desc' },
          select: {
            id: true,
            userId: true,
            username: true,
            score: true,
            rank: true,
          },
        },
      },
    })

    if (!game || game.status !== GameStatus.FINISHED) {
      return null
    }

    const duration = game.finishedAt && game.startedAt
      ? game.finishedAt.getTime() - game.startedAt.getTime()
      : 0

    const leaderboard = game.players.map((player, index) => ({
      playerId: player.userId || player.id,
      username: player.username,
      score: player.score,
      rank: player.rank ?? index + 1,
    }))

    return {
      leaderboard,
      duration,
    }
  }
}

export const gameService = new GameService()
