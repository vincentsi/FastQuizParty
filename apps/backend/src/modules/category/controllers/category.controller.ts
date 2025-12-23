import { FastifyRequest, FastifyReply } from 'fastify'
import { CategoryService } from '../services/category.service'

const categoryService = new CategoryService()

export class CategoryController {
  async getAllCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const categories = await categoryService.getAllCategories()
      return reply.status(200).send({
        success: true,
        data: categories,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch categories',
      })
    }
  }

  async getCategoryById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params
      const category = await categoryService.getCategoryById(id)

      if (!category) {
        return reply.status(404).send({
          success: false,
          error: 'Category not found',
        })
      }

      return reply.status(200).send({
        success: true,
        data: category,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch category',
      })
    }
  }

  async getCategoryBySlug(
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { slug } = request.params
      const category = await categoryService.getCategoryBySlug(slug)

      if (!category) {
        return reply.status(404).send({
          success: false,
          error: 'Category not found',
        })
      }

      return reply.status(200).send({
        success: true,
        data: category,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch category',
      })
    }
  }
}

export const categoryController = new CategoryController()
