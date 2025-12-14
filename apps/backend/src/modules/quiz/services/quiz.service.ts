import { prisma } from '@/config/prisma'
import { logger } from '@/utils/logger'
import type { Prisma } from '@prisma/client'
import type { CreateQuizDto, UpdateQuizDto, GetQuizzesQuery } from '../schemas/quiz.schema'

export class QuizService {
  /**
   * Get all quizzes with pagination and filters
   */
  async getQuizzes(query: GetQuizzesQuery, userId?: string) {
    const { page, limit, categoryId, difficulty, isPublic, search } = query
    const skip = (page - 1) * limit

    const where: Prisma.QuizWhereInput = {}

    // Filters
    if (categoryId) where.categoryId = categoryId
    if (difficulty && difficulty !== 'MIXED') where.difficulty = difficulty
    if (isPublic !== undefined) {
      where.isPublic = isPublic
    } else if (!userId) {
      // If not authenticated, only show public quizzes
      where.isPublic = true
    }

    // Search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // If authenticated, show public quizzes + user's own quizzes
    if (userId && isPublic === undefined) {
      where.OR = [{ isPublic: true }, { authorId: userId }]
    }

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quiz.count({ where }),
    ])

    return {
      quizzes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get quiz by ID with questions
   */
  async getQuizById(id: string, includeQuestions = false) {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: includeQuestions
          ? {
              orderBy: { order: 'asc' },
            }
          : false,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    })

    if (!quiz) {
      throw new Error('Quiz not found')
    }

    return quiz
  }

  /**
   * Create a new quiz
   */
  async createQuiz(data: CreateQuizDto, authorId: string) {
    const { questions, ...quizData } = data

    const quiz = await prisma.quiz.create({
      data: {
        ...quizData,
        authorId,
        questions: questions
          ? {
              create: questions.map((q, index) => ({
                ...q,
                order: index + 1,
              })),
            }
          : undefined,
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        category: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    })

    logger.info({ quizId: quiz.id, authorId }, 'Quiz created')

    return quiz
  }

  /**
   * Update quiz
   */
  async updateQuiz(id: string, data: UpdateQuizDto, userId: string) {
    // Check ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!quiz) {
      throw new Error('Quiz not found')
    }

    if (quiz.authorId !== userId) {
      throw new Error('Unauthorized: You can only edit your own quizzes')
    }

    const updated = await prisma.quiz.update({
      where: { id },
      data,
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        category: true,
      },
    })

    logger.info({ quizId: id, userId }, 'Quiz updated')

    return updated
  }

  /**
   * Delete quiz
   */
  async deleteQuiz(id: string, userId: string) {
    // Check ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!quiz) {
      throw new Error('Quiz not found')
    }

    if (quiz.authorId !== userId) {
      throw new Error('Unauthorized: You can only delete your own quizzes')
    }

    await prisma.quiz.delete({
      where: { id },
    })

    logger.info({ quizId: id, userId }, 'Quiz deleted')
  }

  /**
   * Increment play count
   */
  async incrementPlayCount(quizId: string) {
    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        playCount: {
          increment: 1,
        },
      },
    })
  }
}

export const quizService = new QuizService()
