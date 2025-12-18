import type { Server, Socket } from 'socket.io'
import { roomService } from '../services/room.service'
import { validateSocketEvent } from '@/modules/realtime/middleware/validation.middleware'
import {
  RoomCreateSchema,
  RoomJoinSchema,
} from '../schemas/room.schema'
import { logger } from '@/utils/logger'
import type { Room } from '../types/room.types'
import { startGameFlow } from './game.handler'

/**
 * Room Event Handlers
 *
 * Handles all Socket.IO events related to game room management:
 * - room:create - Create new game room
 * - room:join - Join existing room
 * - room:leave - Leave room
 * - room:ready - Toggle ready status
 * - room:start - Start game (host only)
 * - room:list - Get public rooms list
 */

export function registerRoomHandlers(io: Server, socket: Socket) {
  /**
   * Create a new game room
   */
  socket.on('room:create', async (data, callback) => {
    logger.info({ data, socketId: socket.id }, 'Received room:create event')
    const validate = validateSocketEvent(RoomCreateSchema)
    const validated = validate(socket, data)

    if (!validated) {
      logger.warn({ data, socketId: socket.id }, 'Room creation validation failed')
      return callback?.({ success: false, error: 'Invalid data' })
    }

    try {
      const userId = socket.data.userId
      const username = socket.data.username || 'Guest'

      const guestId = !userId ? (socket.data.guestId as string | undefined) : undefined

      // For guests, use undefined as hostId (not socket.id) so they can be matched by guestId on rejoin
      const hostId = userId || undefined

      const room = await roomService.createRoom(
        hostId,
        username,
        socket.id,
        validated,
        guestId
      )

      // Join socket to room channel
      await socket.join(room.id)

      // Store player ID and room ID in socket data
      const host = Array.from(room.players.values()).find(p => p.isHost)
      if (host) {
        socket.data.playerId = host.id
        socket.data.roomId = room.id
      }

      logger.info(
        { roomId: room.id, code: room.code, userId, socketId: socket.id },
        'Room created'
      )

      // Return room data to creator
      callback?.({
        success: true,
        data: serializeRoom(room),
      })

      // Broadcast to public room list if public
      if (!room.isPrivate) {
        io.emit('room:list:updated')
      }
    } catch (error) {
      logger.error({ error, socketId: socket.id, userId: socket.data.userId }, 'Room creation failed')

      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create room',
      })
    }
  })

  /**
   * Join an existing room
   */
  socket.on('room:join', async (data, callback) => {
    const validate = validateSocketEvent(RoomJoinSchema)
    const validated = validate(socket, data)

    if (!validated) {
      return callback?.({ success: false, error: 'Invalid data' })
    }

    try {
      const userId = socket.data.userId
      const username = validated.username || socket.data.username || 'Guest'

      // If in a different room, leave it first
      const existingRoomId = socket.data.roomId
      const roomByCode = await roomService.getRoomByCode(validated.code)
      if (existingRoomId && roomByCode && existingRoomId !== roomByCode.id) {
        const existingPlayerId = socket.data.playerId
        if (existingPlayerId) {
          await roomService.leaveRoom(existingRoomId, existingPlayerId)
          socket.leave(existingRoomId)
          socket.data.roomId = undefined
          socket.data.playerId = undefined
        }
      }

      const guestId = !userId ? (socket.data.guestId as string | undefined) : undefined

      // Check if we need to clean zombies first
      // This allows us to broadcast the cleaned state immediately
      const roomBeforeJoin = await roomService.getRoomByCode(validated.code)
      let needsZombieCleanBroadcast = false
      if (roomBeforeJoin && guestId) {
        // Check if there are zombies with this guestId
        for (const p of roomBeforeJoin.players.values()) {
          if (!p.userId && p.guestId === guestId && !p.isConnected) {
            needsZombieCleanBroadcast = true
            break
          }
        }
      }

      const { room, player } = await roomService.joinRoom(
        validated.code,
        userId,
        username,
        socket.id,
        validated.password,
        guestId
      )

      // If zombies were cleaned, broadcast immediately to all clients in room
      // This prevents other users from seeing the zombie until the join completes
      if (needsZombieCleanBroadcast && roomBeforeJoin) {
        logger.info({ roomId: room.id, guestId }, 'Broadcasting zombie cleanup to room')
        io.to(roomBeforeJoin.id).emit('room:updated', {
          room: serializeRoom(room),
        })
      }

      // Join socket to room channel
      await socket.join(room.id)

      // Store player ID in socket data
      socket.data.playerId = player.id
      socket.data.roomId = room.id

      logger.info(
        { roomId: room.id, playerId: player.id, username, socketId: socket.id },
        'Player joined room'
      )

      // Return room data to joining player
      callback?.({
        success: true,
        data: {
          room: serializeRoom(room),
          player,
        },
      })

      // Small delay to ensure room is saved to Redis before broadcasting
      // This ensures room:updated has the latest state with isConnected: true
      await new Promise(resolve => setTimeout(resolve, 100))

      // Broadcast to all players in room (send full room state for sync)
      // Re-fetch room from Redis to ensure we have the latest state
      const latestRoom = await roomService.getRoom(room.id)
      if (latestRoom) {
        io.to(room.id).emit('room:updated', {
          room: serializeRoom(latestRoom),
        })
      } else {
        // Fallback to original room if fetch fails
        io.to(room.id).emit('room:updated', {
          room: serializeRoom(room),
        })
      }

      // Also send individual player joined event for backward compatibility
      socket.to(room.id).emit('room:player:joined', {
        player,
        playerCount: room.players.size,
      })

      // Update public room list
      if (!room.isPrivate) {
        io.emit('room:list:updated')
      }
    } catch (error) {
      logger.error({ error, socketId: socket.id, userId: socket.data.userId }, 'Room join failed')

      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join room',
      })
    }
  })

  /**
   * Leave current room
   */
  socket.on('room:leave', async (callback) => {
    try {
      const roomId = socket.data.roomId
      const playerId = socket.data.playerId

      if (!roomId || !playerId) {
        return callback?.({ success: false, error: 'Not in a room' })
      }

      const room = await roomService.leaveRoom(roomId, playerId)

      // Leave socket room
      await socket.leave(roomId)

      // Clear socket data
      socket.data.roomId = undefined
      socket.data.playerId = undefined

      logger.info({ roomId, playerId, socketId: socket.id }, 'Player left room')

      callback?.({ success: true })

      if (room) {
        // Room still exists, broadcast full room state to remaining players
        io.to(roomId).emit('room:updated', {
          room: serializeRoom(room),
        })

        // Also send individual player left event for backward compatibility
        socket.to(roomId).emit('room:player:left', {
          playerId,
          playerCount: room.players.size,
        })

        // Update public room list
        if (!room.isPrivate) {
          io.emit('room:list:updated')
        }
      } else {
        // Room was deleted (empty)
        io.to(roomId).emit('room:deleted')
        io.emit('room:list:updated')
      }
    } catch (error) {
      logger.error({ error, socketId: socket.id }, 'Room leave failed')

      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to leave room',
      })
    }
  })

  /**
   * Toggle ready status
   */
  socket.on('room:ready', async (callback) => {
    try {
      const roomId = socket.data.roomId
      const playerId = socket.data.playerId

      if (!roomId || !playerId) {
        return callback?.({ success: false, error: 'Not in a room' })
      }

      const room = await roomService.togglePlayerReady(roomId, playerId)

      const player = room.players.get(playerId)

      logger.info(
        { roomId, playerId, isReady: player?.isReady, socketId: socket.id },
        'Player ready status toggled'
      )

      callback?.({ success: true, isReady: player?.isReady })

      // Broadcast full room state to all players
      io.to(roomId).emit('room:updated', {
        room: serializeRoom(room),
      })

      // Also send individual ready event for backward compatibility
      io.to(roomId).emit('room:player:ready', {
        playerId,
        isReady: player?.isReady,
      })
    } catch (error) {
      logger.error({ error, socketId: socket.id }, 'Toggle ready failed')

      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle ready',
      })
    }
  })

  /**
   * Start game (host only)
   */
  socket.on('room:start', async (callback) => {
    try {
      const roomId = socket.data.roomId
      const userId = socket.data.userId || socket.id

      if (!roomId) {
        return callback?.({ success: false, error: 'Not in a room' })
      }

      const room = await roomService.startGame(roomId, userId)

      logger.info({ roomId, hostId: userId, playerCount: room.players.size }, 'Game starting')

      callback?.({ success: true })

      // Broadcast to all players in room
      io.to(roomId).emit('room:game:starting', {
        roomId,
        players: Array.from(room.players.values()),
        startedAt: room.startedAt,
      })

      // Update public room list (room no longer joinable)
      if (!room.isPrivate) {
        io.emit('room:list:updated')
      }

      // Démarrer le game flow (countdown + questions)
      startGameFlow(io, roomId).catch((error) => {
        logger.error({ error, roomId }, 'Game flow failed to start')
      })
    } catch (error) {
      logger.error({ error, socketId: socket.id }, 'Game start failed')

      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start game',
      })
    }
  })

  /**
   * Get list of public rooms
   */
  socket.on('room:list', async (callback) => {
    try {
      const rooms = await roomService.listPublicRooms()

      callback?.({
        success: true,
        data: rooms,
      })
    } catch (error) {
      logger.error({ error, socketId: socket.id }, 'Room list fetch failed')

      callback?.({
        success: false,
        error: 'Failed to fetch room list',
      })
    }
  })

  /**
   * Handle disconnect
   */
  socket.on('disconnect', async () => {
    const roomId = socket.data.roomId
    const playerId = socket.data.playerId

    if (roomId && playerId) {
      try {
        const room = await roomService.leaveRoom(roomId, playerId)

        logger.info({ roomId, playerId, socketId: socket.id }, 'Player disconnected from room')

        if (room) {
          // Room still exists, broadcast full room state
          io.to(roomId).emit('room:updated', {
            room: serializeRoom(room),
          })

          // Also send individual disconnected event for backward compatibility
          socket.to(roomId).emit('room:player:disconnected', {
            playerId,
            playerCount: room.players.size,
          })

          if (!room.isPrivate) {
            io.emit('room:list:updated')
          }
        } else {
          // Room deleted
          io.to(roomId).emit('room:deleted')
          io.emit('room:list:updated')
        }
      } catch (error) {
        logger.error({ error, roomId, playerId }, 'Error handling disconnect')
      }
    }
  })
}

/**
 * Serialize Room for client (convert Map to Array)
 */
function serializeRoom(room: Room) {
  const { password: _password, ...rest } = room
  return {
    ...rest,
    players: Array.from(room.players.values()),
  }
}
