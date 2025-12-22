import { z } from 'zod'

// Enums
export const DifficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD', 'MIXED'])

// Question schema
export const createQuestionSchema = z.object({
  text: z.string().min(5, 'Question text must be at least 5 characters').max(500),
  explanation: z.string().max(1000).optional(),
  options: z.array(z.string().min(1).max(200)).length(4, 'Must have exactly 4 options'),
  correctAnswer: z.number().int().min(0).max(3),
  difficulty: DifficultyEnum.default('MEDIUM'),
  timeLimit: z.number().int().min(5).max(60).default(15),
  points: z.number().int().min(100).max(10000).default(1000),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
})

export const updateQuestionSchema = createQuestionSchema.partial()

// Quiz schema
export const createQuizSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().url().optional(),
  isPublic: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  difficulty: DifficultyEnum.default('MIXED'),
  categoryId: z.string().cuid().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  questions: z.array(createQuestionSchema).min(1, 'Quiz must have at least 1 question').max(100).optional(),
})

export const updateQuizSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().url().optional(),
  isPublic: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  difficulty: DifficultyEnum.optional(),
  categoryId: z.string().cuid().optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

// Query params
export const getQuizzesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().cuid().optional(),
  difficulty: DifficultyEnum.optional(),
  isPublic: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  authorId: z.string().cuid().optional(),
})

// Types
export type CreateQuizDto = z.infer<typeof createQuizSchema>
export type UpdateQuizDto = z.infer<typeof updateQuizSchema>
export type CreateQuestionDto = z.infer<typeof createQuestionSchema>
export type UpdateQuestionDto = z.infer<typeof updateQuestionSchema>
export type GetQuizzesQuery = z.infer<typeof getQuizzesQuerySchema>
