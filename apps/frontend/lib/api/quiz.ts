import { apiClient } from './client'

// ============================================
// Types
// ============================================

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'

export type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
}

export type Question = {
  id: string
  quizId: string
  text: string
  options: string[] // Parsed from JSON
  correctAnswer: number
  difficulty: Difficulty
  timeLimit: number
  points: number
  order: number
  explanation?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  createdAt: string
  updatedAt: string
}

export type Quiz = {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  authorId: string | null
  categoryId: string | null
  isPublic: boolean
  isPremium: boolean
  difficulty: Difficulty
  isAiGenerated: boolean
  tags: string[]
  playCount: number
  createdAt: string
  updatedAt: string
  category?: Category | null
  author?: {
    id: string
    name: string | null
  } | null
  questions?: Question[]
  _count?: {
    questions: number
  }
}

export type GetQuizzesQuery = {
  page?: number
  limit?: number
  categoryId?: string
  difficulty?: Difficulty
  isPublic?: boolean
  search?: string
}

export type GetQuizzesResponse = {
  quizzes: Quiz[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type CreateQuizDto = {
  title: string
  description?: string
  thumbnail?: string
  isPublic?: boolean
  isPremium?: boolean
  difficulty?: Difficulty
  categoryId?: string
  tags?: string[]
  questions?: CreateQuestionDto[]
}

export type UpdateQuizDto = {
  title?: string
  description?: string
  thumbnail?: string
  isPublic?: boolean
  isPremium?: boolean
  difficulty?: Difficulty
  categoryId?: string
  tags?: string[]
}

export type CreateQuestionDto = {
  text: string
  explanation?: string
  options: string[]
  correctAnswer: number
  difficulty?: Difficulty
  timeLimit?: number
  points?: number
  imageUrl?: string
  videoUrl?: string
}

export type UpdateQuestionDto = {
  text?: string
  explanation?: string
  options?: string[]
  correctAnswer?: number
  difficulty?: Difficulty
  timeLimit?: number
  points?: number
  imageUrl?: string
  videoUrl?: string
}

// ============================================
// API Client
// ============================================

export const quizApi = {
  /**
   * Get all quizzes with pagination and filters
   */
  getQuizzes: async (query: GetQuizzesQuery = {}): Promise<GetQuizzesResponse> => {
    const params = new URLSearchParams()

    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.categoryId) params.append('categoryId', query.categoryId)
    if (query.difficulty) params.append('difficulty', query.difficulty)
    if (query.isPublic !== undefined) params.append('isPublic', query.isPublic.toString())
    if (query.search) params.append('search', query.search)

    const response = await apiClient.get<{ success: boolean; data: GetQuizzesResponse }>(
      `/api/quiz?${params.toString()}`
    )

    return response.data.data
  },

  /**
   * Get a single quiz by ID with questions
   */
  getQuiz: async (id: string): Promise<Quiz> => {
    const response = await apiClient.get<{ success: boolean; data: Quiz }>(
      `/api/quiz/${id}`
    )
    return response.data.data
  },

  /**
   * Create a new quiz
   */
  createQuiz: async (data: CreateQuizDto): Promise<Quiz> => {
    const response = await apiClient.post<{ success: boolean; data: Quiz }>(
      '/api/quiz',
      data
    )
    return response.data.data
  },

  /**
   * Update a quiz
   */
  updateQuiz: async (id: string, data: UpdateQuizDto): Promise<Quiz> => {
    const response = await apiClient.put<{ success: boolean; data: Quiz }>(
      `/api/quiz/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete a quiz
   */
  deleteQuiz: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/quiz/${id}`)
  },

  /**
   * Get all questions for a quiz
   */
  getQuestions: async (quizId: string): Promise<Question[]> => {
    const response = await apiClient.get<{ success: boolean; data: Question[] }>(
      `/api/quiz/${quizId}/questions`
    )
    return response.data.data
  },

  /**
   * Create a new question for a quiz
   */
  createQuestion: async (quizId: string, data: CreateQuestionDto): Promise<Question> => {
    const response = await apiClient.post<{ success: boolean; data: Question }>(
      `/api/quiz/${quizId}/questions`,
      data
    )
    return response.data.data
  },

  /**
   * Update a question
   */
  updateQuestion: async (id: string, data: UpdateQuestionDto): Promise<Question> => {
    const response = await apiClient.put<{ success: boolean; data: Question }>(
      `/api/questions/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete a question
   */
  deleteQuestion: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/questions/${id}`)
  },
}
