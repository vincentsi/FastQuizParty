import { z } from 'zod'

export const generateQuizSchema = z.object({
  prompt: z.string().min(10).max(500),
  count: z.number().int().min(5).max(50),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional().default('MEDIUM'),
  category: z.string().optional(),
})

export const improveQuestionSchema = z.object({
  questionId: z.string().uuid(),
  improvements: z.array(z.string()).optional(),
})

export type GenerateQuizDto = z.infer<typeof generateQuizSchema>
export type ImproveQuestionDto = z.infer<typeof improveQuestionSchema>
