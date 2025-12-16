/**
 * Frontend types for Game
 */

export interface Question {
  id: string
  text: string
  options: string[]
  timeLimit: number
  points: number
  order: number
}

export interface QuestionData {
  question: Question
  questionNumber: number
  totalQuestions: number
  startTime: number
}

export interface AnswerResult {
  isCorrect: boolean
  correctAnswer: number
  points: number
  timeMs: number
  newScore: number
  rank: number
}

export interface LeaderboardEntry {
  playerId: string
  username: string
  score: number
  rank: number
}

export interface GameFinishedData {
  leaderboard: LeaderboardEntry[]
  duration: number
}

export enum GamePhase {
  WAITING = 'WAITING',
  COUNTDOWN = 'COUNTDOWN',
  QUESTION = 'QUESTION',
  ANSWER_REVEAL = 'ANSWER_REVEAL',
  SCOREBOARD = 'SCOREBOARD',
  FINISHED = 'FINISHED',
}

export interface GameState {
  phase: GamePhase
  currentQuestion: QuestionData | null
  myAnswer: number | null
  answerResult: AnswerResult | null
  leaderboard: LeaderboardEntry[]
  countdown: number | null
  timeRemaining: number
  canAnswer: boolean
}
