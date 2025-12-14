import type { FastifyRequest, FastifyReply } from 'fastify'
import { quizService } from '../services/quiz.service'
import { questionService } from '../services/question.service'
import {
  createQuizSchema,
  updateQuizSchema,
  getQuizzesQuerySchema,
  createQuestionSchema,
  updateQuestionSchema,
  type CreateQuizDto,
  type UpdateQuizDto,
  type GetQuizzesQuery,
  type CreateQuestionDto,
  type UpdateQuestionDto,
} from '../schemas/quiz.schema'

export class QuizController {
  /**
   * GET /api/quiz
   */
  async getQuizzes(
    request: FastifyRequest<{ Querystring: GetQuizzesQuery }>,
    reply: FastifyReply
  ) {
    const query = getQuizzesQuerySchema.parse(request.query)
    const userId = request.user?.userId

    const result = await quizService.getQuizzes(query, userId)

    return reply.status(200).send({
      success: true,
      data: result,
    })
  }

  /**
   * GET /api/quiz/:id
   */
  async getQuiz(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params

    const quiz = await quizService.getQuizById(id, true)

    // If quiz is private, check ownership
    if (!quiz.isPublic && quiz.authorId !== request.user?.userId) {
      return reply.status(403).send({
        success: false,
        error: 'This quiz is private',
      })
    }

    return reply.status(200).send({
      success: true,
      data: quiz,
    })
  }

  /**
   * POST /api/quiz
   */
  async createQuiz(request: FastifyRequest<{ Body: CreateQuizDto }>, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      })
    }

    const data = createQuizSchema.parse(request.body)

    const quiz = await quizService.createQuiz(data, request.user.userId)

    return reply.status(201).send({
      success: true,
      data: quiz,
    })
  }

  /**
   * PUT /api/quiz/:id
   */
  async updateQuiz(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateQuizDto }>,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { id } = request.params
    const data = updateQuizSchema.parse(request.body)

    try {
      const quiz = await quizService.updateQuiz(id, data, request.user.userId)

      return reply.status(200).send({
        success: true,
        data: quiz,
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return reply.status(403).send({
          success: false,
          error: error.message,
        })
      }
      throw error
    }
  }

  /**
   * DELETE /api/quiz/:id
   */
  async deleteQuiz(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { id } = request.params

    try {
      await quizService.deleteQuiz(id, request.user.userId)

      return reply.status(200).send({
        success: true,
        message: 'Quiz deleted successfully',
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return reply.status(403).send({
          success: false,
          error: error.message,
        })
      }
      throw error
    }
  }

  /**
   * GET /api/quiz/:id/questions
   */
  async getQuestions(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params

    const questions = await questionService.getQuestionsByQuizId(id)

    return reply.status(200).send({
      success: true,
      data: questions,
    })
  }

  /**
   * POST /api/quiz/:id/questions
   */
  async createQuestion(
    request: FastifyRequest<{ Params: { id: string }; Body: CreateQuestionDto }>,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { id } = request.params
    const data = createQuestionSchema.parse(request.body)

    try {
      const question = await questionService.createQuestion(id, data, request.user.userId)

      return reply.status(201).send({
        success: true,
        data: question,
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return reply.status(403).send({
          success: false,
          error: error.message,
        })
      }
      throw error
    }
  }

  /**
   * PUT /api/questions/:id
   */
  async updateQuestion(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateQuestionDto }>,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { id } = request.params
    const data = updateQuestionSchema.parse(request.body)

    try {
      const question = await questionService.updateQuestion(id, data, request.user.userId)

      return reply.status(200).send({
        success: true,
        data: question,
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return reply.status(403).send({
          success: false,
          error: error.message,
        })
      }
      throw error
    }
  }

  /**
   * DELETE /api/questions/:id
   */
  async deleteQuestion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { id } = request.params

    try {
      await questionService.deleteQuestion(id, request.user.userId)

      return reply.status(200).send({
        success: true,
        message: 'Question deleted successfully',
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return reply.status(403).send({
          success: false,
          error: error.message,
        })
      }
      throw error
    }
  }
}

export const quizController = new QuizController()
