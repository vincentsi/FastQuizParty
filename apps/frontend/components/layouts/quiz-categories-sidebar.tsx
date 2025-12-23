'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { categoryApi } from '@/lib/api/category'
import { Loader2 } from 'lucide-react'

export function QuizCategoriesSidebar() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories,
  })

  return (
    <aside className="fixed left-0 top-[105px] h-[calc(100vh-105px)] w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 overflow-y-auto z-40">
      {/* Categories */}
      <div className="py-6 px-2">
        <h3 className="px-4 mb-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
          Catégories
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <nav className="space-y-1">
            {categories?.map((category) => (
              <Link
                key={category.id}
                href={`/quiz?category=${category.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                <span className="text-2xl flex-shrink-0">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </aside>
  )
}
