import type { FastifyInstance } from 'fastify'
import { gameController } from '../controllers/game.controller'

/**
 * Game routes
 * Handles game results and game data endpoints
 */
export async function gameRoutes(app: FastifyInstance) {
  /**
   * GET /api/games/:id/results
   * Get results of a finished game
   * Public route (anyone can view results of finished games)
   */
  app.get<{ Params: { id: string } }>('/games/:id/results', async (request, reply) => {
    return gameController.getGameResults(request, reply)
  })
}

