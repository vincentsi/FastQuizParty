'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Trophy,
  Gamepad2,
  Monitor,
  Music,
  Film,
  BookOpen,
  Globe,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const categories = [
  { id: 'sport', label: 'Sport', icon: Trophy },
  { id: 'games', label: 'Jeux', icon: Gamepad2 },
  { id: 'esport', label: 'Esport', icon: Monitor },
  { id: 'music', label: 'Musique', icon: Music },
  { id: 'movies', label: 'Films', icon: Film },
  { id: 'culture', label: 'Culture', icon: BookOpen },
  { id: 'geography', label: 'Géographie', icon: Globe },
  { id: 'science', label: 'Science', icon: Lightbulb },
]

interface QuizCategoriesSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function QuizCategoriesSidebar({
  isCollapsed,
  onToggle,
}: QuizCategoriesSidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-[73px] h-[calc(100vh-73px)] bg-white dark:bg-gray-900 border-r dark:border-gray-800 transition-all duration-300 z-10',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Categories */}
      <div className="py-6 px-2">
        {!isCollapsed && (
          <h3 className="px-4 mb-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
            Catégories
          </h3>
        )}

        <nav className="space-y-1">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link
                key={category.id}
                href={`/quizzes?category=${category.id}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-gray-800',
                  isCollapsed && 'justify-center'
                )}
                title={isCollapsed ? category.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{category.label}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
