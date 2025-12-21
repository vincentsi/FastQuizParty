import { prisma } from '@/config/prisma'
import { logger } from '@/utils/logger'
import type { CreateQuestionDto, UpdateQuestionDto } from '../schemas/quiz.schema'

export class QuestionService {
  /**
   * Get all questions for a quiz
   */
  async getQuestionsByQuizId(quizId: string) {
    return prisma.question.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
    })
  }

  /**
   * Get question by ID
   */
  async getQuestionById(id: string) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            authorId: true,
          },
        },
      },
    })

    if (!question) {
      throw new Error('Question not found')
    }

    return question
  }

  /**
   * Create a new question
   */
  async createQuestion(quizId: string, data: CreateQuestionDto, userId: string) {
    // Check quiz ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        authorId: true,
        _count: {
          select: { questions: true },
        },
      },
    })

    if (!quiz) {
      throw new Error('Quiz not found')
    }

    if (quiz.authorId !== userId) {
      throw new Error('Unauthorized: You can only add questions to your own quizzes')
    }

    // Get next order number
    const nextOrder = quiz._count.questions + 1

    const question = await prisma.question.create({
      data: {
        ...data,
        quizId,
        order: nextOrder,
      },
    })

    logger.info({ questionId: question.id, quizId, userId }, 'Question created')

    return question
  }

  /**
   * Bulk create questions
   */
  async bulkCreateQuestions(quizId: string, questions: CreateQuestionDto[], userId: string) {
    // Check quiz ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { authorId: true },
    })

    if (!quiz) {
      throw new Error('Quiz not found')
    }

    if (quiz.authorId !== userId) {
      throw new Error('Unauthorized')
    }

    const created = await prisma.question.createMany({
      data: questions.map((q, index) => ({
        ...q,
        quizId,
        order: index + 1,
      })),
    })

    logger.info({ count: created.count, quizId, userId }, 'Questions bulk created')

    return created
  }

  /**
   * Update question
   */
  async updateQuestion(id: string, data: UpdateQuestionDto, userId: string) {
    // Check ownership
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        quiz: {
          select: { authorId: true },
        },
      },
    })

    if (!question) {
      throw new Error('Question not found')
    }

    if (question.quiz.authorId !== userId) {
      throw new Error('Unauthorized')
    }

    const updated = await prisma.question.update({
      where: { id },
      data,
    })

    logger.info({ questionId: id, userId }, 'Question updated')

    return updated
  }

  /**
   * Delete question
   */
  async deleteQuestion(id: string, userId: string) {
    // Check ownership
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        quiz: {
          select: { authorId: true },
        },
      },
    })

    if (!question) {
      throw new Error('Question not found')
    }

    if (question.quiz.authorId !== userId) {
      throw new Error('Unauthorized')
    }

    await prisma.question.delete({
      where: { id },
    })

    logger.info({ questionId: id, userId }, 'Question deleted')
  }

  /**
   * Reorder questions
   */
  async reorderQuestions(quizId: string, questionIds: string[], userId: string) {
    // Check ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { authorId: true },
    })

    if (!quiz) {
      throw new Error('Quiz not found')
    }

    if (quiz.authorId !== userId) {
      throw new Error('Unauthorized')
    }

    // Update orders - Use transaction for batch updates (more efficient than N queries)
    await prisma.$transaction(
      questionIds.map((questionId, index) =>
        prisma.question.update({
          where: { id: questionId },
          data: { order: index + 1 },
        })
      )
    )

    logger.info({ quizId, userId }, 'Questions reordered')
  }
}

export const questionService = new QuestionService()
