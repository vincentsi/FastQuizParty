import { apiClient } from './client'

// ============================================
// Types
// ============================================

export type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  createdAt: string
  updatedAt: string
}

// ============================================
// API Functions
// ============================================

export const categoryApi = {
  /**
   * Get all categories
   */
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<{ success: boolean; data: Category[] }>('/api/category')
    return response.data.data
  },

  /**
   * Get a single category by ID
   */
  getCategoryById: async (id: string): Promise<Category> => {
    const response = await apiClient.get<{ success: boolean; data: Category }>(
      `/api/category/${id}`
    )
    return response.data.data
  },

  /**
   * Get a single category by slug
   */
  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const response = await apiClient.get<{ success: boolean; data: Category }>(
      `/api/category/slug/${slug}`
    )
    return response.data.data
  },
}
