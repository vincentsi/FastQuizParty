import { create } from 'zustand'

interface Question {
  id: string
  text: string
  options: string[]
  imageUrl?: string
  timeLimit: number
  points: number
}

interface PlayerScore {
  playerId: string
  userId?: string
  username: string
  avatar?: string
  score: number
  rank: number
  correctAnswers: number
  totalAnswers: number
  avgResponseTime: number
}

interface Room {
  id: string
  code: string
  hostId: string
  status: 'waiting' | 'starting' | 'playing' | 'finished'
  settings: {
    maxPlayers: number
    questionTime: number
    isPrivate: boolean
  }
  players: Player[]
}

interface Player {
  id: string
  userId?: string
  username: string
  avatar?: string
  isHost: boolean
  isReady: boolean
  isConnected: boolean
}

interface GameStore {
  // Room state
  room: Room | null
  setRoom: (room: Room | null) => void

  // Game state
  gameStatus: 'idle' | 'waiting' | 'starting' | 'playing' | 'finished'
  setGameStatus: (status: GameStore['gameStatus']) => void

  // Current question
  currentQuestion: Question | null
  questionNumber: number
  totalQuestions: number
  timeRemaining: number
  setCurrentQuestion: (question: Question | null, number?: number, total?: number) => void
  setTimeRemaining: (time: number) => void

  // My answer
  myAnswer: number | null
  setMyAnswer: (answer: number | null) => void

  // Scores
  scores: PlayerScore[]
  updateScores: (scores: PlayerScore[]) => void

  // Actions
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  // Room state
  room: null,
  setRoom: (room) => set({ room }),

  // Game state
  gameStatus: 'idle',
  setGameStatus: (gameStatus) => set({ gameStatus }),

  // Current question
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 0,
  timeRemaining: 0,
  setCurrentQuestion: (currentQuestion, questionNumber = 0, totalQuestions = 0) =>
    set({ currentQuestion, questionNumber, totalQuestions }),
  setTimeRemaining: (timeRemaining) => set({ timeRemaining }),

  // My answer
  myAnswer: null,
  setMyAnswer: (myAnswer) => set({ myAnswer }),

  // Scores
  scores: [],
  updateScores: (scores) => set({ scores }),

  // Actions
  reset: () =>
    set({
      room: null,
      gameStatus: 'idle',
      currentQuestion: null,
      questionNumber: 0,
      totalQuestions: 0,
      timeRemaining: 0,
      myAnswer: null,
      scores: [],
    }),
}))
