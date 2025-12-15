import type { GameStatus } from '@prisma/client'

export interface Player {
  id: string
  userId?: string // Optional for guest players
  username: string
  isHost: boolean
  isReady: boolean
  isConnected: boolean
  score: number
  correctAnswers: number
  socketId: string
  joinedAt: number
}

export interface RoomSettings {
  quizId: string
  maxPlayers: number
  questionTime: number
  isPrivate: boolean
  password?: string
}

export interface Room {
  id: string
  code: string // 6-digit code for joining
  quizId: string
  hostId: string
  maxPlayers: number
  questionTime: number
  isPrivate: boolean
  password?: string
  status: GameStatus
  players: Map<string, Player>
  createdAt: number
  startedAt?: number
  currentQuestionIndex?: number
}

export interface RoomCreateDto {
  quizId: string
  maxPlayers?: number
  questionTime?: number
  isPrivate?: boolean
  password?: string
}

export interface RoomJoinDto {
  code: string
  password?: string
  username?: string // For guest players
}

export interface RoomListItem {
  id: string
  code: string
  quizId: string
  quizTitle: string
  hostUsername: string
  playerCount: number
  maxPlayers: number
  status: GameStatus
  isPrivate: boolean
  createdAt: number
}
