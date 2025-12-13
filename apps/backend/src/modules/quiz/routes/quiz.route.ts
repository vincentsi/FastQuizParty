import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '@/middlewares/auth.middleware'
import { quizController } from '../controllers/quiz.controller'
import type {
  GetQuizzesQuery,
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
} from '../schemas/quiz.schema'

/**
 * Quiz routes
 * Handles quiz and question CRUD operations
 */
export async function quizRoutes(app: FastifyInstance) {
  // ============================================
  // Quiz Routes
  // ============================================

  /**
   * GET /api/quiz
   * Get all quizzes (with pagination, filters)
   * Public route but shows more content for authenticated users
   */
  app.get<{ Querystring: GetQuizzesQuery }>('/quiz', async (request, reply) => {
    return quizController.getQuizzes(request, reply)
  })

  /**
   * GET /api/quiz/:id
   * Get a specific quiz with its questions
   * Public for public quizzes, requires ownership for private quizzes
   */
  app.get<{ Params: { id: string } }>('/quiz/:id', async (request, reply) => {
    return quizController.getQuiz(request, reply)
  })

  /**
   * POST /api/quiz
   * Create a new quiz
   * Requires authentication
   */
  app.post<{ Body: CreateQuizDto }>(
    '/quiz',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      return quizController.createQuiz(request, reply)
    }
  )

  /**
   * PUT /api/quiz/:id
   * Update an existing quiz
   * Requires authentication and ownership
   */
  app.put<{ Params: { id: string }; Body: UpdateQuizDto }>(
    '/quiz/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      return quizController.updateQuiz(request, reply)
    }
  )

  /**
   * DELETE /api/quiz/:id
   * Delete a quiz
   * Requires authentication and ownership
   */
  app.delete<{ Params: { id: string } }>(
    '/quiz/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      return quizController.deleteQuiz(request, reply)
    }
  )

  // ============================================
  // Question Routes
  // ============================================

  /**
   * GET /api/quiz/:id/questions
   * Get all questions for a specific quiz
   * Public route
   */
  app.get<{ Params: { id: string } }>('/quiz/:id/questions', async (request, reply) => {
    return quizController.getQuestions(request, reply)
  })

  /**
   * POST /api/quiz/:id/questions
   * Create a new question for a quiz
   * Requires authentication and quiz ownership
   */
  app.post<{ Params: { id: string }; Body: CreateQuestionDto }>(
    '/quiz/:id/questions',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      return quizController.createQuestion(request, reply)
    }
  )

  /**
   * PUT /api/questions/:id
   * Update an existing question
   * Requires authentication and quiz ownership
   */
  app.put<{ Params: { id: string }; Body: UpdateQuestionDto }>(
    '/questions/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      return quizController.updateQuestion(request, reply)
    }
  )

  /**
   * DELETE /api/questions/:id
   * Delete a question
   * Requires authentication and quiz ownership
   */
  app.delete<{ Params: { id: string } }>(
    '/questions/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      return quizController.deleteQuestion(request, reply)
    }
  )
}
