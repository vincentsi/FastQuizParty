import { FastifyInstance } from 'fastify'
import { categoryController } from '../controllers/category.controller'

export async function categoryRoutes(server: FastifyInstance) {
  // Get all categories
  server.get('/', categoryController.getAllCategories.bind(categoryController))

  // Get category by ID
  server.get('/:id', categoryController.getCategoryById.bind(categoryController))

  // Get category by slug
  server.get('/slug/:slug', categoryController.getCategoryBySlug.bind(categoryController))
}
