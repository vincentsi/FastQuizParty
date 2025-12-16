import type { FastifyInstance } from 'fastify'
import { aiController } from '../controllers/ai.controller'
import { generateQuizSchema, improveQuestionSchema } from '../schemas/ai.schema'
import { authMiddleware } from '@/middlewares/auth.middleware'

export async function aiRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', authMiddleware)

  // Generate quiz with AI
  fastify.post(
    '/generate-quiz',
    {
      schema: {
        body: generateQuizSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              quiz: { type: 'object' },
            },
          },
        },
      },
    },
    aiController.generateQuiz.bind(aiController)
  )

  // Improve question with AI
  fastify.post(
    '/improve-question',
    {
      schema: {
        body: improveQuestionSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              question: { type: 'object' },
            },
          },
        },
      },
    },
    aiController.improveQuestion.bind(aiController)
  )
}
