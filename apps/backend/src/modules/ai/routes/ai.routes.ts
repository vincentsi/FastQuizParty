import type { FastifyInstance } from 'fastify'
import { aiController } from '../controllers/ai.controller'
import type { GenerateQuizDto, ImproveQuestionDto } from '../schemas/ai.schema'
import { authMiddleware } from '@/middlewares/auth.middleware'

export async function aiRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', authMiddleware)

  // Generate quiz with AI
  fastify.post<{ Body: GenerateQuizDto }>(
    '/generate-quiz',
    async (request, reply) => {
      return aiController.generateQuiz(request, reply)
    }
  )

  // Improve question with AI
  fastify.post<{ Body: ImproveQuestionDto }>(
    '/improve-question',
    async (request, reply) => {
      return aiController.improveQuestion(request, reply)
    }
  )
}
