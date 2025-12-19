import { logger } from '@/utils/logger'
import type { Server, Socket } from 'socket.io'
import { antiCheatService } from '../services/anti-cheat.service'
import { gameService } from '../services/game.service'
import { roomService } from '../services/room.service'

/**
 * Game Event Handlers
 *
 * Gère le flow du jeu en temps réel:
 * - game:answer - Soumettre une réponse
 * - Timers automatiques pour chaque question
 * - Broadcast des updates aux joueurs
 */

// Map pour stocker les timers actifs par room
const questionTimers = new Map<string, NodeJS.Timeout>()

// Fonction pour annuler un timer
function clearQuestionTimer(roomId: string) {
  const timer = questionTimers.get(roomId)
  if (timer) {
    clearTimeout(timer)
    questionTimers.delete(roomId)
    logger.info({ roomId }, 'Question timer cleared')
  }
}

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

      // Recharger le gameState pour avoir les données à jour
      const updatedGameState = await gameService.getGameState(roomId)
      if (!updatedGameState) {
        return
      }

      // Broadcast update du scoreboard (sans changer la phase)
      const leaderboard = gameService.getLeaderboard(updatedGameState)
      io.to(roomId).emit('game:scoreboard:update', {
        leaderboard,
      })

      // Vérifier si tous les joueurs connectés ont répondu
      const room = await roomService.getRoom(roomId)
      if (room) {
        // Compter uniquement les joueurs actuellement dans la room
        const activePlayers = Array.from(room.players.values())
        const activePlayerIds = activePlayers.map(p => p.id)

        // Vérifier si tous les joueurs actifs ont répondu à la question actuelle
        const allAnswered = activePlayerIds.every(playerId => {
          const playerAnswers = updatedGameState.playerAnswers.get(playerId) || []
          return playerAnswers.length === updatedGameState.currentQuestionIndex + 1
        })

        logger.info({
          roomId,
          currentQuestionIndex: updatedGameState.currentQuestionIndex,
          activePlayers: activePlayers.length,
          allAnswered,
        }, 'Checking if all players answered')

        // Si tous ont répondu, annuler le timer de timeout et avancer/finir
        if (allAnswered && activePlayers.length > 0) {
          // Vérifier si c'est la dernière question
          const isLastQuestion = updatedGameState.currentQuestionIndex === updatedGameState.questions.length - 1

          if (isLastQuestion) {
            logger.info({ roomId }, 'All players answered last question, finishing game soon')

            // Annuler le timer de timeout
            clearQuestionTimer(roomId)

            // Attendre 1.5s pour laisser voir le résultat, puis finir
            setTimeout(async () => {
              await gameService.endGame(updatedGameState)
              const finalGameState = await gameService.getGameState(roomId)

              if (finalGameState) {
                const leaderboard = gameService.getLeaderboard(finalGameState)
                io.to(roomId).emit('game:finished', {
                  leaderboard,
                  duration: finalGameState.finishedAt! - finalGameState.startedAt,
                })

                logger.info({ roomId }, 'Game finished after last question')

                // Nettoyer le gameState après l'émission
                setTimeout(() => {
                  gameService.deleteGameState(roomId).catch((error) => {
                    logger.warn({ error, roomId }, 'Failed to delete game state from redis')
                  })
                }, 5000)
              }
            }, 1500)
          } else {
            logger.info({ roomId }, 'All players answered, advancing to next question')

            // Annuler le timer de timeout de la question
            clearQuestionTimer(roomId)

            setTimeout(async () => {
              await advanceToNextQuestion(io, roomId)
            }, 2000)
          }
        }
      }

      // Anti-cheat: Détecter les patterns suspects
      if (antiCheatResult.isSuspicious && updatedGameState) {
        const playerAnswers = updatedGameState.playerAnswers.get(playerId) || []
        const pattern = {
          playerId,
          answers: playerAnswers.map(a => ({
            timeMs: a.timeMs,
            isCorrect: a.isCorrect,
            timestamp: a.timestamp,
          })),
        }

        const suspicionResult =
          antiCheatService.detectSuspiciousPattern(pattern)
        if (suspicionResult.isSuspicious) {
          antiCheatService.logSuspiciousPlayer(pattern, suspicionResult)
        }
      }
    } catch (error) {
      logger.error({ error, socketId: socket.id }, 'Failed to submit answer')

      callback?.({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to submit answer',
      })
    }
  })
}

/**
 * Avancer à la question suivante
 */
async function advanceToNextQuestion(
  io: Server,
  roomId: string
): Promise<void> {
  // Recharger le gameState depuis Redis
  const gameState = await gameService.getGameState(roomId)
  if (!gameState) {
    logger.error({ roomId }, 'Cannot advance: game state not found')
    return
  }

  const nextQuestion = await gameService.nextQuestion(gameState)

  if (!nextQuestion) {
    // Partie terminée - recharger le state final
    await gameService.endGame(gameState)
    const finalGameState = await gameService.getGameState(roomId)

    if (!finalGameState) {
      logger.error({ roomId }, 'Cannot finish: game state not found')
      return
    }

    const leaderboard = gameService.getLeaderboard(finalGameState)

    io.to(roomId).emit('game:finished', {
      leaderboard,
      duration: finalGameState.finishedAt! - finalGameState.startedAt,
    })

    logger.info({ roomId }, 'Game finished, all questions answered')

    // Nettoyer le gameState après l'émission
    setTimeout(() => {
      gameService.deleteGameState(roomId).catch((error) => {
        logger.warn({ error, roomId }, 'Failed to delete game state from redis')
      })
    }, 5000)

    return
  }

  // Recharger le gameState après nextQuestion pour avoir les données à jour
  const updatedGameState = await gameService.getGameState(roomId)
  if (!updatedGameState) {
    logger.error(
      { roomId },
      'Cannot advance: game state not found after nextQuestion'
    )
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
    questionNumber: updatedGameState.currentQuestionIndex + 1,
    totalQuestions: updatedGameState.questions.length,
    startTime: updatedGameState.questionStartTime,
  })

  // Timer automatique pour la question
  const timer = setTimeout(
    async () => {
      await handleQuestionTimeout(io, roomId)
    },
    nextQuestion.timeLimit * 1000 + 500
  ) // +500ms de buffer

  // Stocker le timer pour pouvoir l'annuler si besoin
  questionTimers.set(roomId, timer)
}

/**
 * Gérer le timeout d'une question
 */
async function handleQuestionTimeout(
  io: Server,
  roomId: string
): Promise<void> {
  // Supprimer le timer de la Map (il vient de se déclencher)
  questionTimers.delete(roomId)

  // Recharger le gameState depuis Redis
  const gameState = await gameService.getGameState(roomId)
  if (!gameState) {
    logger.error({ roomId }, 'Cannot handle timeout: game state not found')
    return
  }

  const currentQuestion = gameService.getCurrentQuestion(gameState)
  if (!currentQuestion) {
    logger.warn({ roomId }, 'No current question on timeout')
    return
  }

  logger.info({ roomId }, 'Question timeout - showing answer and advancing')

  // Broadcast que le temps est écoulé
  io.to(roomId).emit('game:question:timeout', {
    questionId: currentQuestion.id,
    correctAnswer: currentQuestion.correctAnswer,
  })

  // Attendre 3s pour montrer la réponse, puis next question
  setTimeout(async () => {
    await advanceToNextQuestion(io, roomId)
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
    await new Promise(resolve => setTimeout(resolve, 1000))

    io.to(roomId).emit('game:countdown', { seconds: 2 })
    await new Promise(resolve => setTimeout(resolve, 1000))

    io.to(roomId).emit('game:countdown', { seconds: 1 })
    await new Promise(resolve => setTimeout(resolve, 1000))

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
    const timer = setTimeout(
      async () => {
        await handleQuestionTimeout(io, roomId)
      },
      firstQuestion.timeLimit * 1000 + 500
    )

    // Stocker le timer pour pouvoir l'annuler si besoin
    questionTimers.set(roomId, timer)

    logger.info({ roomId, quizId: room.quizId }, 'Game flow started')
  } catch (error) {
    logger.error({ error, roomId }, 'Failed to start game flow')

    io.to(roomId).emit('game:error', {
      message: 'Failed to start game',
    })
  }
}
