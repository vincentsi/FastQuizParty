import type { FastifyRequest, FastifyReply } from 'fastify'
import { gameService } from '../services/game.service'
import { roomService } from '../services/room.service'
import { logger } from '@/utils/logger'

export class GameController {
  /**
   * GET /api/games/:id/results
   * Récupérer les résultats d'une partie terminée
   */
  async getGameResults(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params

      const results = await gameService.getGameResults(id)

      if (!results) {
        return reply.status(404).send({
          success: false,
          error: 'Game not found or not finished',
        })
      }

      return reply.status(200).send({
        success: true,
        data: results,
      })
    } catch (error) {
      logger.error({ error, gameId: request.params.id }, 'Failed to get game results')

      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve game results',
      })
    }
  }

  /**
   * GET /api/rooms/:id/code
   * Get room code by room ID (for joining via Socket.IO)
   */
  async getRoomCode(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params

      const room = await roomService.getRoom(id)

      if (!room) {
        return reply.status(404).send({
          success: false,
          error: 'Room not found',
        })
      }

      return reply.status(200).send({
        success: true,
        data: { code: room.code, isPrivate: room.isPrivate },
      })
    } catch (error) {
      logger.error({ error, roomId: request.params.id }, 'Failed to get room code')

      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve room code',
      })
    }
  }
}

export const gameController = new GameController()

