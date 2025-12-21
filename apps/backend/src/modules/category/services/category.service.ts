import { prisma } from '@/config/prisma'
import { CacheService } from '@/services/cache.service'
import { DistributedLockService } from '@/services/distributed-lock.service'
import { logger } from '@/utils/logger'

const CATEGORY_CACHE_KEY = 'categories:all'
const CATEGORY_LOCK_KEY = 'lock:cache:categories'
const LOCK_TIMEOUT = 5000 // 5 seconds

export class CategoryService {
  /**
   * Get all categories with cache stampede protection
   */
  async getAllCategories() {
    // Try cache first
    const cached = await CacheService.get<unknown[]>(CATEGORY_CACHE_KEY)

    if (cached) {
      return cached
    }

    // Use distributed lock to prevent cache stampede
    try {
      const categories = await DistributedLockService.executeWithLock(
        CATEGORY_LOCK_KEY,
        LOCK_TIMEOUT,
        async () => {
          // Double-check: another request might have filled the cache
          const recheck = await CacheService.get<unknown[]>(CATEGORY_CACHE_KEY)
          if (recheck) return recheck

          // Fetch from database (only one request executes this)
          const data = await prisma.category.findMany({
            orderBy: { name: 'asc' },
          })

          // Cache for 1 hour (categories don't change often)
          await CacheService.set(CATEGORY_CACHE_KEY, data, 3600)

          return data
        }
      )

      return categories
    } catch (error) {
      // If lock timeout or Redis down, fetch normally (graceful degradation)
      logger.warn({ error }, 'Failed to acquire lock for categories cache')

      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      })

      return categories
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id },
    })
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
    })
  }
}

export const categoryService = new CategoryService()
