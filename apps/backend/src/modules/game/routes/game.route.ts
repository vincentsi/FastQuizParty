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
  app.get<{ Params: { id: string } }>(
    '/games/:id/results',
    async (request, reply) => {
      return gameController.getGameResults(request, reply)
    }
  )

  /**
   * GET /api/rooms/:id/code
   * Get room code by room ID (for joining via Socket.IO)
   * Public route
   */
  app.get<{ Params: { id: string } }>(
    '/rooms/:id/code',
    async (request, reply) => {
      return gameController.getRoomCode(request, reply)
    }
  )
}
