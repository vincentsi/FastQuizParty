import { apiClient } from './client'
import type { Difficulty } from './quiz'

// ============================================
// Types
// ============================================

export type GenerateQuizRequest = {
  prompt: string
  count: number
  difficulty?: Difficulty
  category?: string
}

export type GeneratedQuestion = {
  text: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export type GenerateQuizResponse = {
  questions: GeneratedQuestion[]
}

// ============================================
// API Functions
// ============================================

export const aiApi = {
  /**
   * Generate quiz questions with AI
   */
  generateQuiz: async (data: GenerateQuizRequest): Promise<GenerateQuizResponse> => {
    const response = await apiClient.post<{ success: boolean; data: GenerateQuizResponse }>(
      '/api/ai/generate-quiz',
      data
    )
    return response.data.data
  },
}
