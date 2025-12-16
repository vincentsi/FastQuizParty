import type { FastifyReply, FastifyRequest } from 'fastify'
import { openAIService } from '../services/openai.service'
import type { GenerateQuizDto, ImproveQuestionDto } from '../schemas/ai.schema'
import { quizService } from '@/modules/quiz/services/quiz.service'
import { questionService } from '@/modules/quiz/services/question.service'
import { logger } from '@/utils/logger'

export class AIController {
  /**
   * Generate a quiz using AI
   * POST /api/ai/generate-quiz
   */
  async generateQuiz(
    request: FastifyRequest<{ Body: GenerateQuizDto }>,
    reply: FastifyReply
  ) {
    const { prompt, count, difficulty, category } = request.body
    const userId = request.user!.userId

    try {
      // Check user quota (Premium feature)
      if (request.user!.role === 'USER') {
        return reply.status(403).send({
          error: 'Premium feature',
          message: 'AI quiz generation is only available for Premium users',
        })
      }

      // Generate quiz with OpenAI
      const generatedQuiz = await openAIService.generateQuiz({
        prompt,
        count,
        difficulty: difficulty?.toLowerCase() as 'easy' | 'medium' | 'hard',
        category,
      })

      // Create quiz in database
      const quiz = await quizService.createQuiz({
        title: generatedQuiz.title,
        description: `Generated quiz: ${prompt}`,
        difficulty: difficulty || 'MEDIUM',
        categoryId: category,
        tags: ['ai-generated'],
        isPublic: false,
        isPremium: false,
      }, userId)

      // Create questions
      const questions = await Promise.all(
        generatedQuiz.questions.map((q) =>
          questionService.createQuestion(quiz.id, {
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
            timeLimit: 15,
            points: 100,
          }, userId)
        )
      )

      logger.info(
        {
          userId,
          quizId: quiz.id,
          questionCount: questions.length,
        },
        'AI quiz generated successfully'
      )

      return reply.status(201).send({
        quiz: {
          ...quiz,
          questions,
        },
      })
    } catch (error) {
      logger.error({ error, userId, prompt }, 'Failed to generate quiz')
      return reply.status(500).send({
        error: 'Generation failed',
        message: 'Failed to generate quiz. Please try again.',
      })
    }
  }

  /**
   * Improve an existing question using AI
   * POST /api/ai/improve-question
   */
  async improveQuestion(
    request: FastifyRequest<{ Body: ImproveQuestionDto }>,
    reply: FastifyReply
  ) {
    const { questionId } = request.body
    const userId = request.user!.userId

    try {
      // Check Premium
      if (request.user!.role === 'USER') {
        return reply.status(403).send({
          error: 'Premium feature',
          message: 'AI question improvement is only available for Premium users',
        })
      }

      // Get existing question
      const existingQuestion = await questionService.getQuestionById(questionId)
      if (!existingQuestion) {
        return reply.status(404).send({ error: 'Question not found' })
      }

      // Check ownership
      const quiz = await quizService.getQuizById(existingQuestion.quizId)
      if (!quiz || quiz.authorId !== userId) {
        return reply.status(403).send({ error: 'Not authorized' })
      }

      // Improve with AI
      const improved = await openAIService.improveQuestion({
        text: existingQuestion.text,
        options: existingQuestion.options as string[],
      })

      // Update question
      const updatedQuestion = await questionService.updateQuestion(questionId, {
        text: improved.text,
        options: improved.options,
        explanation: improved.explanation,
      }, userId)

      logger.info({ userId, questionId }, 'Question improved with AI')

      return reply.send({ question: updatedQuestion })
    } catch (error) {
      logger.error({ error, userId, questionId }, 'Failed to improve question')
      return reply.status(500).send({
        error: 'Improvement failed',
        message: 'Failed to improve question. Please try again.',
      })
    }
  }
}

export const aiController = new AIController()
