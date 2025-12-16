import type { Server, Socket } from 'socket.io'
import { gameService } from '../services/game.service'
import { antiCheatService } from '../services/anti-cheat.service'
import { roomService } from '../services/room.service'
import { logger } from '@/utils/logger'

/**
 * Game Event Handlers
 *
 * Gère le flow du jeu en temps réel:
 * - game:answer - Soumettre une réponse
 * - Timers automatiques pour chaque question
 * - Broadcast des updates aux joueurs
 */

export function registerGameHandlers(io: Server, socket: Socket) {
  /**
   * Soumettre une réponse
   */
  socket.on('game:answer', async (data: { answer: number }, callback) => {
    try {
      const roomId = socket.data.roomId
      const playerId = socket.data.playerId

      if (!roomId || !playerId) {
        return callback?.({
          success: false,
          error: 'Not in a game',
        })
      }

      // Sanitize l'input
      const sanitizedAnswer = antiCheatService.sanitizeAnswer(data.answer)
      if (sanitizedAnswer === null) {
        return callback?.({
          success: false,
          error: 'Invalid answer format',
        })
      }

      // Charger le game state
      const gameState = await gameService.getGameState(roomId)
      if (!gameState) {
        return callback?.({
          success: false,
          error: 'Game not found',
        })
      }

      const timestamp = Date.now()

      // Anti-cheat: Valider le timestamp
      const currentQuestion = gameService.getCurrentQuestion(gameState)
      if (!currentQuestion) {
        return callback?.({
          success: false,
          error: 'No current question',
        })
      }

      const antiCheatResult = antiCheatService.validateAnswer(
        timestamp,
        gameState.questionStartTime,
        currentQuestion.timeLimit
      )

      if (!antiCheatResult.isValid) {
        logger.warn(
          {
            playerId,
            roomId,
            reason: antiCheatResult.reason,
          },
          'Answer rejected by anti-cheat'
        )

        return callback?.({
          success: false,
          error: antiCheatResult.reason,
        })
      }

      // Soumettre la réponse
      const result = await gameService.submitAnswer(
        gameState,
        playerId,
        sanitizedAnswer,
        timestamp
      )

      // Retourner le résultat au joueur
      callback?.({
        success: true,
        data: {
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer,
          points: result.points,
          timeMs: result.timeMs,
          newScore: result.newScore,
          rank: result.rank,
        },
      })

      // Broadcast update du scoreboard
      const leaderboard = gameService.getLeaderboard(gameState)
      io.to(roomId).emit('game:scoreboard:update', {
        leaderboard,
      })

      // Vérifier si tous les joueurs ont répondu
      const room = await roomService.getRoom(roomId)
      if (room) {
        const allAnswered = Array.from(gameState.playerAnswers.values()).every(
          (answers) => answers.length === gameState.currentQuestionIndex + 1
        )

        // Si tous ont répondu, avancer à la question suivante après 2s
        if (allAnswered) {
          setTimeout(async () => {
            await advanceToNextQuestion(io, roomId, gameState)
          }, 2000)
        }
      }

      // Anti-cheat: Détecter les patterns suspects
      if (antiCheatResult.isSuspicious) {
        const playerAnswers = gameState.playerAnswers.get(playerId) || []
        const pattern = {
          playerId,
          answers: playerAnswers.map((a) => ({
            timeMs: a.timeMs,
            isCorrect: a.isCorrect,
            timestamp: a.timestamp,
          })),
        }

        const suspicionResult = antiCheatService.detectSuspiciousPattern(pattern)
        if (suspicionResult.isSuspicious) {
          antiCheatService.logSuspiciousPlayer(pattern, suspicionResult)
        }
      }
    } catch (error) {
      logger.error({ error, socketId: socket.id }, 'Failed to submit answer')

      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit answer',
      })
    }
  })
}

/**
 * Avancer à la question suivante
 */
async function advanceToNextQuestion(
  io: Server,
  roomId: string,
  gameState: ReturnType<typeof gameService.getGameState> extends Promise<infer T> ? NonNullable<T> : never
): Promise<void> {
  const nextQuestion = await gameService.nextQuestion(gameState)

  if (!nextQuestion) {
    // Partie terminée
    await gameService.endGame(gameState)

    const leaderboard = gameService.getLeaderboard(gameState)

    io.to(roomId).emit('game:finished', {
      leaderboard,
      duration: gameState.finishedAt! - gameState.startedAt,
    })

    logger.info({ roomId }, 'Game finished, all questions answered')
    return
  }

  // Broadcast la nouvelle question (sans la bonne réponse)
  io.to(roomId).emit('game:question', {
    question: {
      id: nextQuestion.id,
      text: nextQuestion.text,
      options: JSON.parse(nextQuestion.options as string),
      timeLimit: nextQuestion.timeLimit,
      points: nextQuestion.points,
      order: nextQuestion.order,
    },
    questionNumber: gameState.currentQuestionIndex + 1,
    totalQuestions: gameState.questions.length,
    startTime: gameState.questionStartTime,
  })

  // Timer automatique pour la question
  setTimeout(async () => {
    await handleQuestionTimeout(io, roomId, gameState)
  }, nextQuestion.timeLimit * 1000 + 500) // +500ms de buffer
}

/**
 * Gérer le timeout d'une question
 */
async function handleQuestionTimeout(
  io: Server,
  roomId: string,
  gameState: ReturnType<typeof gameService.getGameState> extends Promise<infer T> ? NonNullable<T> : never
): Promise<void> {
  const currentQuestion = gameService.getCurrentQuestion(gameState)
  if (!currentQuestion) return

  // Broadcast que le temps est écoulé
  io.to(roomId).emit('game:question:timeout', {
    questionId: currentQuestion.id,
    correctAnswer: currentQuestion.correctAnswer,
  })

  // Attendre 3s pour montrer la réponse, puis next question
  setTimeout(async () => {
    await advanceToNextQuestion(io, roomId, gameState)
  }, 3000)
}

/**
 * Démarrer le flow du jeu
 */
export async function startGameFlow(io: Server, roomId: string): Promise<void> {
  const room = await roomService.getRoom(roomId)
  if (!room) {
    logger.error({ roomId }, 'Cannot start game: room not found')
    return
  }

  try {
    // Démarrer le jeu
    const gameState = await gameService.startGame(room)

    // Countdown 3s
    io.to(roomId).emit('game:countdown', { seconds: 3 })
    await new Promise((resolve) => setTimeout(resolve, 1000))

    io.to(roomId).emit('game:countdown', { seconds: 2 })
    await new Promise((resolve) => setTimeout(resolve, 1000))

    io.to(roomId).emit('game:countdown', { seconds: 1 })
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Envoyer la première question
    const firstQuestion = gameService.getCurrentQuestion(gameState)
    if (!firstQuestion) {
      throw new Error('No questions in quiz')
    }

    io.to(roomId).emit('game:started', {
      quizId: gameState.quizId,
      totalQuestions: gameState.questions.length,
    })

    io.to(roomId).emit('game:question', {
      question: {
        id: firstQuestion.id,
        text: firstQuestion.text,
        options: JSON.parse(firstQuestion.options as string),
        timeLimit: firstQuestion.timeLimit,
        points: firstQuestion.points,
        order: firstQuestion.order,
      },
      questionNumber: 1,
      totalQuestions: gameState.questions.length,
      startTime: gameState.questionStartTime,
    })

    // Timer pour la première question
    setTimeout(async () => {
      await handleQuestionTimeout(io, roomId, gameState)
    }, firstQuestion.timeLimit * 1000 + 500)

    logger.info({ roomId, quizId: room.quizId }, 'Game flow started')
  } catch (error) {
    logger.error({ error, roomId }, 'Failed to start game flow')

    io.to(roomId).emit('game:error', {
      message: 'Failed to start game',
    })
  }
}
