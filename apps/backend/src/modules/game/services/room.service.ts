import { prisma } from '@/config/prisma'
import { getRedis, isRedisAvailable } from '@/config/redis'
import { logger } from '@/utils/logger'
import { GameStatus } from '@prisma/client'
import crypto from 'crypto'
import type {
  Player,
  Room,
  RoomCreateDto,
  RoomListItem,
} from '../types/room.types'

export class RoomService {
  private readonly ROOM_TTL = 7200
  private readonly CODE_LENGTH = 6

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex')
  }

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

  async createRoom(
    hostId: string,
    hostUsername: string,
    hostSocketId: string,
    dto: RoomCreateDto,
    guestId?: string
  ): Promise<Room> {
    // Verify quiz exists
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
      userId: hostId || undefined,
      guestId: !hostId && guestId ? guestId : undefined,
      username: hostUsername,
      isHost: true,
      isReady: true,
      isConnected: true,
      score: 0,
      correctAnswers: 0,
      socketId: hostSocketId,
      joinedAt: Date.now(),
    }

    logger.info(
      {
        hostId: host.id,
        userId: host.userId,
        guestId: host.guestId,
        username: host.username,
        isHost: host.isHost,
        roomId,
        code,
      },
      'Created host player in createRoom'
    )

    const room: Room = {
      id: roomId,
      code,
      quizId: dto.quizId,
      hostId: host.id, // Use player.id as hostId (consistent with room.hostId usage)
      maxPlayers: dto.maxPlayers || 10,
      questionTime: dto.questionTime || 15,
      isPrivate: dto.isPrivate || false,
      password: dto.password ? this.hashPassword(dto.password) : undefined,
      status: GameStatus.WAITING,
      players: new Map([[host.id, host]]),
      createdAt: Date.now(),
    }

    await this.saveRoom(room)

    logger.info({ roomId, code, hostId, quizId: dto.quizId }, 'Room created')

    return room
  }

  async joinRoom(
    code: string,
    userId: string | undefined,
    username: string,
    socketId: string,
    password?: string,
    guestId?: string
  ): Promise<{ room: Room; player: Player }> {
    const room = await this.getRoomByCode(code)

    if (!room) {
      throw new Error('Room not found')
    }

    // Validation checks
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

    // Clean up old disconnected guest players with same guestId BEFORE matching
    // This prevents duplicates when a guest refreshes before disconnect event is processed
    let cleanedZombies = false
    if (guestId) {
      const playersToRemove: string[] = []
      for (const [pid, p] of room.players.entries()) {
        // Remove disconnected guests with same guestId (but different playerId)
        if (!p.userId && p.guestId === guestId && !p.isConnected && p.socketId !== socketId) {
          playersToRemove.push(pid)
        }
      }
      for (const pid of playersToRemove) {
        logger.info(
          { playerId: pid, guestId, roomId: room.id },
          'Removing old disconnected guest before rejoin'
        )
        room.players.delete(pid)
        cleanedZombies = true
      }
      // Save room immediately if zombies were cleaned
      if (cleanedZombies) {
        await this.saveRoom(room)
      }
    }

    // Check if player already exists (reuse on rejoin)
    let player: Player | undefined

    logger.info(
      {
        roomId: room.id,
        userId,
        guestId,
        socketId,
        username,
        existingPlayers: Array.from(room.players.values()).map(p => ({
          id: p.id,
          userId: p.userId,
          guestId: p.guestId,
          username: p.username,
          isHost: p.isHost,
          isConnected: p.isConnected,
          socketId: p.socketId,
        })),
      },
      'Attempting to find existing player in joinRoom'
    )

    if (userId) {
      // For authenticated users, match by userId
      for (const p of room.players.values()) {
        if (p.userId === userId) {
          player = p
          logger.info(
            { playerId: p.id, matchedBy: 'userId' },
            'Found existing player by userId'
          )
          break
        }
      }
    } else {
      // For guests, match by guestId first (persistent across refreshes)
      if (guestId) {
        for (const p of room.players.values()) {
          if (!p.userId && p.guestId === guestId) {
            player = p
            logger.info(
              {
                playerId: p.id,
                guestId,
                matchedBy: 'guestId',
                wasHost: p.isHost,
              },
              'Found existing player by guestId'
            )
            break
          }
        }
      }
      // If not found by guestId, match by socketId (same connection)
      if (!player) {
        for (const p of room.players.values()) {
          if (!p.userId && p.socketId === socketId) {
            player = p
            break
          }
        }
      }
      // If still not found, match by username ONLY if disconnected (reconnection after refresh)
      if (!player) {
        // First, try to find a disconnected player with same username
        for (const p of room.players.values()) {
          if (!p.userId && !p.isConnected && p.username === username) {
            player = p
            break
          }
        }
        // If still not found and no active player with same username exists, allow reconnection
        if (!player) {
          const hasActivePlayerWithSameUsername = Array.from(
            room.players.values()
          ).some(p => !p.userId && p.isConnected && p.username === username)
          // Only reuse if no active player with same username exists
          if (!hasActivePlayerWithSameUsername) {
            for (const p of room.players.values()) {
              if (
                !p.userId &&
                p.username === username &&
                p.socketId !== socketId
              ) {
                player = p
                break
              }
            }
          }
        }
      }
    }

    if (player) {
      // Reuse existing player - preserve isHost status
      const wasHost = player.isHost
      player.socketId = socketId
      player.isConnected = true
      player.username = username
      // Ensure host status is preserved
      if (wasHost) {
        player.isHost = true
        player.isReady = true
        room.hostId = player.userId || player.id
      }
    } else {
      // Create new player
      logger.info(
        {
          guestId,
          username,
          roomId: room.id,
          existingPlayersCount: room.players.size,
        },
        'No existing player found, creating new player'
      )
      player = {
        id: crypto.randomUUID(),
        userId,
        guestId, // Store guestId for persistent identification
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
    }

    await this.saveRoom(room)

    logger.info(
      {
        roomId: room.id,
        playerId: player.id,
        username,
        playerCount: room.players.size,
      },
      'Player joined room'
    )

    return { room, player }
  }

  async leaveRoom(roomId: string, playerId: string): Promise<Room | null> {
    const room = await this.getRoom(roomId)

    if (!room) {
      return null
    }

    const player = room.players.get(playerId)
    if (!player) {
      return room
    }

    // If host leaves, delete the room entirely
    if (player.isHost) {
      await this.deleteRoom(roomId)
      logger.info({ roomId }, 'Room deleted because host left')
      return null
    }

    // Guests: remove entirely on leave/disconnect
    if (!player.userId) {
      room.players.delete(playerId)
    } else {
      // Authenticated non-host: remove
      room.players.delete(playerId)
    }

    if (room.players.size === 0) {
      await this.deleteRoom(roomId)
      logger.info({ roomId }, 'Room deleted (empty)')
      return null
    }

    await this.saveRoom(room)

    logger.info(
      { roomId, playerId, playerCount: room.players.size },
      'Player left room'
    )

    return room
  }

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

    const allReady = Array.from(room.players.values()).every(
      p => p.isReady || p.isHost
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
      // Convert players object back to Map
      parsed.players = new Map(Object.entries(parsed.players || {}))

      return parsed as Room
    } catch (error) {
      logger.error({ error, roomId }, 'Failed to get room')
      return null
    }
  }

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

  private async saveRoom(room: Room): Promise<void> {
    if (!isRedisAvailable()) {
      return
    }

    try {
      const redis = getRedis()
      if (!redis) return

      // Convert Map to object for JSON serialization
      const serialized = {
        ...room,
        players: Object.fromEntries(room.players),
      }

      const pipeline = redis.pipeline()
      pipeline.setex(
        `room:${room.id}`,
        this.ROOM_TTL,
        JSON.stringify(serialized)
      )
      pipeline.setex(`room:code:${room.code}`, this.ROOM_TTL, room.id)

      await pipeline.exec()
    } catch (error) {
      logger.error({ error, roomId: room.id }, 'Failed to save room')
    }
  }

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
