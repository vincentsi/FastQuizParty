import { apiClient } from './client'

export type ExportDataResponse = {
  user: Record<string, unknown>
  metadata: Record<string, unknown>
  personalData: Record<string, unknown>
}

export type DeleteAccountDTO = {
  confirmEmail: string
  reason?: string
}

export type AnonymizeAccountDTO = {
  confirmEmail: string
}

/**
 * GDPR API for user data management
 */
export const gdprApi = {
  /**
   * Export all user data (GDPR Article 20)
   * GET /api/gdpr/export-data
   */
  exportData: async (): Promise<ExportDataResponse> => {
    const response = await apiClient.get<{
      success: boolean
      data: ExportDataResponse
    }>('/api/gdpr/export-data')
    return response.data.data
  },

  /**
   * Permanently delete account and all data (GDPR Article 17)
   * DELETE /api/gdpr/delete-data
   */
  deleteAccount: async (
    data: DeleteAccountDTO
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete<{
      success: boolean
      message: string
    }>('/api/gdpr/delete-data', { data })
    return { message: response.data.message || 'Account deleted successfully' }
  },

  /**
   * Anonymize user data (alternative to deletion)
   * POST /api/gdpr/anonymize-data
   */
  anonymizeAccount: async (
    data: AnonymizeAccountDTO
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{
      success: boolean
      message: string
    }>('/api/gdpr/anonymize-data', data)
    return { message: response.data.message }
  },
}
