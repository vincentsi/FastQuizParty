import { getRedis, isRedisAvailable } from '@/config/redis'
import { logger } from '@/utils/logger'
import { prisma } from '@/config/prisma'
import { GameStatus } from '@prisma/client'
import type {
  Room,
  Player,
  RoomCreateDto,
  RoomListItem,
} from '../types/room.types'
import crypto from 'crypto'

/**
 * RoomService - Gestion des salles de jeu en temps réel
 *
 * Utilise Redis pour le stockage des rooms actives (in-memory)
 * Les rooms sont temporaires et ont un TTL de 2h
 */
export class RoomService {
  private readonly ROOM_TTL = 7200 // 2 heures en secondes
  private readonly CODE_LENGTH = 6

  /**
   * Hash room password (SHA-256)
   */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex')
  }

  /**
   * Génère un code unique de 6 chiffres pour une room
   */
  private async generateUniqueCode(): Promise<string> {
    let code: string
    let attempts = 0
    const maxAttempts = 10

    do {
      code = crypto.randomInt(100000, 999999).toString()
      attempts++

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique room code')
      }
    } while (await this.getRoomByCode(code))

    return code
  }

  /**
   * Crée une nouvelle room
   */
  async createRoom(hostId: string, hostUsername: string, hostSocketId: string, dto: RoomCreateDto): Promise<Room> {
    // Vérifier que le quiz existe
    const quiz = await prisma.quiz.findUnique({
      where: { id: dto.quizId },
      select: { id: true, title: true },
    })

    if (!quiz) {
      throw new Error('Quiz not found')
    }

    const roomId = crypto.randomUUID()
    const code = await this.generateUniqueCode()

    const host: Player = {
      id: crypto.randomUUID(),
      userId: hostId,
      username: hostUsername,
      isHost: true,
      isReady: true,
      isConnected: true,
      score: 0,
      correctAnswers: 0,
      socketId: hostSocketId,
      joinedAt: Date.now(),
    }

    const room: Room = {
      id: roomId,
      code,
      quizId: dto.quizId,
      hostId,
      maxPlayers: dto.maxPlayers || 10,
      questionTime: dto.questionTime || 15,
      isPrivate: dto.isPrivate || false,
      password: dto.password ? this.hashPassword(dto.password) : undefined,
      status: GameStatus.WAITING,
      players: new Map([[host.id, host]]),
      createdAt: Date.now(),
    }

    // Sauvegarder dans Redis
    await this.saveRoom(room)

    logger.info({ roomId, code, hostId, quizId: dto.quizId }, 'Room created')

    return room
  }

  /**
   * Rejoindre une room existante
   */
  async joinRoom(
    code: string,
    userId: string | undefined,
    username: string,
    socketId: string,
    password?: string
  ): Promise<{ room: Room; player: Player }> {
    const room = await this.getRoomByCode(code)

    if (!room) {
      throw new Error('Room not found')
    }

    // Vérifications
    if (room.status !== GameStatus.WAITING) {
      throw new Error('Game already started')
    }

    if (room.players.size >= room.maxPlayers) {
      throw new Error('Room is full')
    }

    if (room.isPrivate) {
      const hashed = password ? this.hashPassword(password) : ''
      if (!password || room.password !== hashed) {
        throw new Error('Invalid password')
      }
    }

    // Créer le joueur
    const player: Player = {
      id: crypto.randomUUID(),
      userId,
      username,
      isHost: false,
      isReady: false,
      isConnected: true,
      score: 0,
      correctAnswers: 0,
      socketId,
      joinedAt: Date.now(),
    }

    room.players.set(player.id, player)

    // Sauvegarder
    await this.saveRoom(room)

    logger.info(
      { roomId: room.id, playerId: player.id, username, playerCount: room.players.size },
      'Player joined room'
    )

    return { room, player }
  }

  /**
   * Quitter une room
   */
  async leaveRoom(roomId: string, playerId: string): Promise<Room | null> {
    const room = await this.getRoom(roomId)

    if (!room) {
      return null
    }

    const player = room.players.get(playerId)
    if (!player) {
      return room
    }

    room.players.delete(playerId)

    // Si le host quitte, fermer la room
    if (player.isHost && room.players.size > 0) {
      // Promouvoir un autre joueur comme host
      const newHost = Array.from(room.players.values())[0]
      if (newHost) {
        newHost.isHost = true
        newHost.isReady = true
        room.hostId = newHost.userId || newHost.id
        logger.info({ roomId, newHostId: newHost.id }, 'New host promoted')
      }
    }

    // Si plus personne, supprimer la room
    if (room.players.size === 0) {
      await this.deleteRoom(roomId)
      logger.info({ roomId }, 'Room deleted (empty)')
      return null
    }

    await this.saveRoom(room)

    logger.info({ roomId, playerId, playerCount: room.players.size }, 'Player left room')

    return room
  }

  /**
   * Marquer un joueur comme prêt/pas prêt
   */
  async togglePlayerReady(roomId: string, playerId: string): Promise<Room> {
    const room = await this.getRoom(roomId)

    if (!room) {
      throw new Error('Room not found')
    }

    const player = room.players.get(playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    if (player.isHost) {
      throw new Error('Host is always ready')
    }

    player.isReady = !player.isReady

    await this.saveRoom(room)

    return room
  }

  /**
   * Démarrer la partie (host only)
   */
  async startGame(roomId: string, hostId: string): Promise<Room> {
    const room = await this.getRoom(roomId)

    if (!room) {
      throw new Error('Room not found')
    }

    if (room.hostId !== hostId) {
      throw new Error('Only host can start the game')
    }

    if (room.status !== GameStatus.WAITING) {
      throw new Error('Game already started')
    }

    // Vérifier que tous les joueurs sont prêts
    const allReady = Array.from(room.players.values()).every(
      (p) => p.isReady || p.isHost
    )

    if (!allReady) {
      throw new Error('Not all players are ready')
    }

    room.status = GameStatus.STARTING
    room.startedAt = Date.now()
    room.currentQuestionIndex = 0

    await this.saveRoom(room)

    logger.info({ roomId, playerCount: room.players.size }, 'Game starting')

    return room
  }

  /**
   * Récupérer une room par ID
   */
  async getRoom(roomId: string): Promise<Room | null> {
    if (!isRedisAvailable()) {
      return null
    }

    try {
      const redis = getRedis()
      if (!redis) return null

      const data = await redis.get(`room:${roomId}`)
      if (!data) return null

      const parsed = JSON.parse(data)

      // Reconvertir players de Object à Map
      parsed.players = new Map(Object.entries(parsed.players || {}))

      return parsed as Room
    } catch (error) {
      logger.error({ error, roomId }, 'Failed to get room')
      return null
    }
  }

  /**
   * Récupérer une room par code
   */
  async getRoomByCode(code: string): Promise<Room | null> {
    if (!isRedisAvailable()) {
      return null
    }

    try {
      const redis = getRedis()
      if (!redis) return null

      const roomId = await redis.get(`room:code:${code}`)
      if (!roomId) return null

      return this.getRoom(roomId)
    } catch (error) {
      logger.error({ error, code }, 'Failed to get room by code')
      return null
    }
  }

  /**
   * Lister toutes les rooms publiques actives
   */
  async listPublicRooms(): Promise<RoomListItem[]> {
    if (!isRedisAvailable()) {
      return []
    }

    try {
      const redis = getRedis()
      if (!redis) return []

      const keys = await redis.keys('room:*')
      const rooms: RoomListItem[] = []

      for (const key of keys) {
        if (key.startsWith('room:code:')) continue

        const data = await redis.get(key)
        if (!data) continue

        const room = JSON.parse(data) as Room

        if (room.isPrivate || room.status !== GameStatus.WAITING) {
          continue
        }

        // Récupérer le titre du quiz
        const quiz = await prisma.quiz.findUnique({
          where: { id: room.quizId },
          select: { title: true },
        })

        const host = Array.from(Object.values(room.players || {})).find(
          (p): p is Player => (p as Player).isHost
        )

        rooms.push({
          id: room.id,
          code: room.code,
          quizId: room.quizId,
          quizTitle: quiz?.title || 'Unknown Quiz',
          hostUsername: host?.username || 'Unknown',
          playerCount: Object.keys(room.players || {}).length,
          maxPlayers: room.maxPlayers,
          status: room.status,
          isPrivate: room.isPrivate,
          createdAt: room.createdAt,
        })
      }

      return rooms.sort((a, b) => b.createdAt - a.createdAt)
    } catch (error) {
      logger.error({ error }, 'Failed to list public rooms')
      return []
    }
  }

  /**
   * Sauvegarder une room dans Redis
   */
  private async saveRoom(room: Room): Promise<void> {
    if (!isRedisAvailable()) {
      return
    }

    try {
      const redis = getRedis()
      if (!redis) return

      // Convertir Map en objet pour JSON
      const serialized = {
        ...room,
        players: Object.fromEntries(room.players),
      }

      const pipeline = redis.pipeline()

      // Sauvegarder la room
      pipeline.setex(`room:${room.id}`, this.ROOM_TTL, JSON.stringify(serialized))

      // Index par code
      pipeline.setex(`room:code:${room.code}`, this.ROOM_TTL, room.id)

      await pipeline.exec()
    } catch (error) {
      logger.error({ error, roomId: room.id }, 'Failed to save room')
    }
  }

  /**
   * Supprimer une room
   */
  private async deleteRoom(roomId: string): Promise<void> {
    if (!isRedisAvailable()) {
      return
    }

    try {
      const redis = getRedis()
      if (!redis) return

      const room = await this.getRoom(roomId)
      if (!room) return

      await redis.del(`room:${roomId}`, `room:code:${room.code}`)
    } catch (error) {
      logger.error({ error, roomId }, 'Failed to delete room')
    }
  }

  /**
   * Mettre à jour le statut de connexion d'un joueur
   */
  async updatePlayerConnection(
    roomId: string,
    playerId: string,
    isConnected: boolean
  ): Promise<Room | null> {
    const room = await this.getRoom(roomId)

    if (!room) {
      return null
    }

    const player = room.players.get(playerId)
    if (!player) {
      return room
    }

    player.isConnected = isConnected

    await this.saveRoom(room)

    return room
  }
}

export const roomService = new RoomService()
