'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSocket } from '@/lib/socket/socket-context'
import type {
  GameState,
  GamePhase,
  QuestionData,
  AnswerResult,
  LeaderboardEntry,
  GameFinishedData,
} from '@/types/game'

/**
 * useGame Hook
 *
 * Manages game state and Socket.IO events for active games
 */
export function useGame() {
  const { socket, isConnected } = useSocket()

  const [gameState, setGameState] = useState<GameState>({
    phase: 'WAITING' as GamePhase,
    currentQuestion: null,
    myAnswer: null,
    answerResult: null,
    leaderboard: [],
    countdown: null,
    timeRemaining: 0,
    canAnswer: true,
    duration: 0,
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const questionStartTimeRef = useRef<number>(0)

  /**
   * Submit an answer
   */
  const submitAnswer = useCallback(
    async (answer: number): Promise<AnswerResult | null> => {
      if (!socket || !isConnected || !gameState.canAnswer) {
        return null
      }

      // Marquer comme répondu
      setGameState((prev) => ({
        ...prev,
        myAnswer: answer,
        canAnswer: false,
      }))

      return new Promise((resolve) => {
        socket.emit(
          'game:answer',
          { answer },
          (response: { success: boolean; data?: AnswerResult; error?: string }) => {
            if (response.success && response.data) {
              setGameState((prev) => ({
                ...prev,
                answerResult: response.data!,
              }))
              resolve(response.data)
            } else {
              // Erreur - permettre de répondre à nouveau
              setGameState((prev) => ({
                ...prev,
                myAnswer: null,
                canAnswer: true,
              }))
              resolve(null)
            }
          }
        )
      })
    },
    [socket, isConnected, gameState.canAnswer]
  )

  /**
   * Start question timer
   */
  const startQuestionTimer = useCallback((startTime: number, timeLimit: number) => {
    questionStartTimeRef.current = startTime

    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Update timer every 100ms
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, timeLimit * 1000 - elapsed)

      setGameState((prev) => ({
        ...prev,
        timeRemaining: Math.ceil(remaining / 1000),
      }))

      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }, 100)
  }, [])

  /**
   * Clear timer
   */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    // Countdown before game starts
    socket.on('game:countdown', (data: { seconds: number }) => {
      setGameState((prev) => ({
        ...prev,
        phase: 'COUNTDOWN' as GamePhase,
        countdown: data.seconds,
      }))
    })

    // Game started
    socket.on('game:started', () => {
      setGameState((prev) => ({
        ...prev,
        phase: 'QUESTION' as GamePhase,
        countdown: null,
      }))
    })

    // New question
    socket.on('game:question', (data: QuestionData) => {
      setGameState((prev) => ({
        ...prev,
        phase: 'QUESTION' as GamePhase,
        currentQuestion: data,
        myAnswer: null,
        answerResult: null,
        canAnswer: true,
        timeRemaining: data.question.timeLimit,
      }))

      // Start timer
      startQuestionTimer(data.startTime, data.question.timeLimit)
    })

    // Question timeout
    socket.on('game:question:timeout', (data: { questionId: string; correctAnswer: number }) => {
      clearTimer()

      setGameState((prev) => ({
        ...prev,
        phase: 'ANSWER_REVEAL' as GamePhase,
        canAnswer: false,
        // Si pas encore répondu, montrer la bonne réponse
        answerResult: prev.answerResult || {
          isCorrect: false,
          correctAnswer: data.correctAnswer,
          points: 0,
          timeMs: 0,
          newScore: 0,
          rank: 0,
        },
      }))
    })

    // Scoreboard update (just update leaderboard, don't change phase)
    socket.on('game:scoreboard:update', (data: { leaderboard: LeaderboardEntry[] }) => {
      setGameState((prev) => ({
        ...prev,
        leaderboard: data.leaderboard,
      }))
    })

    // Game finished
    socket.on('game:finished', (data: GameFinishedData) => {
      clearTimer()

      setGameState((prev) => ({
        ...prev,
        phase: 'FINISHED' as GamePhase,
        leaderboard: data.leaderboard,
        duration: data.duration ?? prev.duration,
        answerResult: null, // Clear answer result to hide overlay
        currentQuestion: null, // Clear current question
      }))
    })

    // Error
    socket.on('game:error', (data: { message: string }) => {
      console.error('Game error:', data.message)
    })

    return () => {
      socket.off('game:countdown')
      socket.off('game:started')
      socket.off('game:question')
      socket.off('game:question:timeout')
      socket.off('game:scoreboard:update')
      socket.off('game:finished')
      socket.off('game:error')
      clearTimer()
    }
  }, [socket, startQuestionTimer, clearTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  return {
    gameState,
    submitAnswer,
  }
}
