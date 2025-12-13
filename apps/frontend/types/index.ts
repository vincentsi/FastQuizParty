export type User = {
  id: string
  email: string
  name?: string
  role: 'USER' | 'ADMIN' | 'MODERATOR'
  createdAt: string
  planType?: 'FREE' | 'PRO' | 'BUSINESS'
}
