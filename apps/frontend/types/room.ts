/**
 * Frontend types for Game Rooms
 */

export enum GameStatus {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export interface Player {
  id: string
  userId?: string
  username: string
  isHost: boolean
  isReady: boolean
  isConnected: boolean
  score: number
  correctAnswers: number
  socketId: string
  joinedAt: number
}

export interface Room {
  id: string
  code: string
  quizId: string
  hostId: string
  maxPlayers: number
  questionTime: number
  isPrivate: boolean
  password?: string
  status: GameStatus
  players: Player[]
  createdAt: number
  startedAt?: number
  currentQuestionIndex?: number
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
  username?: string
}
