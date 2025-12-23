import { prisma } from '@/config/prisma'
import { logger } from '@/utils/logger'
import type { Prisma, Quiz, Question, Category } from '@prisma/client'
import { CacheService, CacheKeys } from '@/services/cache.service'
import type { CreateQuizDto, UpdateQuizDto, GetQuizzesQuery } from '../schemas/quiz.schema'

type QuizWithRelations = Quiz & {
  category: Category | null
  author: { id: string; name: string | null } | null
  questions?: Question[]
  _count: { questions: number }
}

export class QuizService {
  /**
   * Get all quizzes with cursor-based pagination and filters
   */
  async getQuizzes(query: GetQuizzesQuery, userId?: string) {
    const { page, limit, categoryId, difficulty, isPublic, search, authorId } = query

    // Pour la compatibilité avec le frontend existant, on garde page/limit
    // mais on les convertit en cursor-based en interne
    const skip = (page - 1) * limit

    const where: Prisma.QuizWhereInput = {}

    // Base filters
    if (categoryId) where.categoryId = categoryId
    if (difficulty && difficulty !== 'MIXED') where.difficulty = difficulty
    if (authorId) where.authorId = authorId

    // Visibility filter
    if (isPublic !== undefined) {
      where.isPublic = isPublic
    } else if (!userId) {
      // If not authenticated, only show public quizzes
      where.isPublic = true
    }

    const andConditions: Prisma.QuizWhereInput[] = []

    if (search) {
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&').trim()

      if (sanitizedSearch && sanitizedSearch.length > 0) {
        andConditions.push({
          OR: [
            { title: { contains: sanitizedSearch, mode: 'insensitive' } },
            { description: { contains: sanitizedSearch, mode: 'insensitive' } },
          ],
        })
      }
    }

    // If authenticated and no explicit isPublic filter and no authorId filter, show public quizzes + user's own quizzes
    if (userId && isPublic === undefined && !authorId) {
      andConditions.push({
        OR: [{ isPublic: true }, { authorId: userId }],
      })
    }

    // Apply AND conditions if any
    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    // Build cache key from filters
    const filterKey = JSON.stringify({ categoryId, difficulty, isPublic, search, userId, authorId })
    const cacheKey = CacheKeys.quizList(page, filterKey)

    // Try cache first
    const cached = await CacheService.get<{
      quizzes: unknown[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>(cacheKey)

    if (cached) {
      return cached
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

    const result = {
      quizzes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }

    // Cache for 5 minutes (quiz lists change frequently)
    await CacheService.set(cacheKey, result, 300)

    return result
  }

  /**
   * Get quiz by ID with questions (with cache)
   */
  async getQuizById(id: string, includeQuestions = false): Promise<QuizWithRelations> {
    // Cache key depends on whether questions are included
    const cacheKey = includeQuestions
      ? CacheKeys.quizQuestions(id)
      : CacheKeys.quiz(id)

    // Try cache first
    const cached = await CacheService.get<QuizWithRelations>(cacheKey)
    if (cached) {
      return cached
    }

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

    // Cache for 1 hour (quiz data doesn't change often)
    await CacheService.set(cacheKey, quiz, 3600)

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

    // Invalidate quiz list caches (only author's caches to reduce impact)
    if (authorId) {
      await CacheService.deletePattern(`quiz:list:*authorId=${authorId}*`)
    }
    // Also invalidate public quiz lists if quiz is public
    if (quiz.isPublic) {
      await CacheService.deletePattern('quiz:list:*isPublic=true*')
    }

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

    // Invalidate cache for this quiz
    await CacheService.delete(CacheKeys.quiz(id))
    await CacheService.delete(CacheKeys.quizQuestions(id))

    // Selective cache invalidation (only affected lists)
    await CacheService.deletePattern(`quiz:list:*authorId=${userId}*`)
    if (updated.categoryId) {
      await CacheService.deletePattern(`quiz:list:*categoryId=${updated.categoryId}*`)
    }
    if (updated.isPublic) {
      await CacheService.deletePattern('quiz:list:*isPublic=true*')
    }

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

    // Invalidate cache
    await CacheService.delete(CacheKeys.quiz(id))
    await CacheService.delete(CacheKeys.quizQuestions(id))

    // Selective invalidation
    await CacheService.deletePattern(`quiz:list:*authorId=${userId}*`)
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

    // Invalidate cache since play count changed
    await CacheService.delete(CacheKeys.quiz(quizId))
    await CacheService.delete(CacheKeys.quizQuestions(quizId))
  }
}

export const quizService = new QuizService()
