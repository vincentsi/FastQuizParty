import type { FastifyRequest, FastifyReply } from 'fastify'
import { gameService } from '../services/game.service'
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
}

export const gameController = new GameController()

