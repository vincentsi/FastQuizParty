'use client'

import { MainNav } from './main-nav'
import { QuizCategoriesSidebar } from './quiz-categories-sidebar'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
  showSidebar?: boolean
}

export function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <MainNav />

      <div className="flex pt-[105px] relative">
        {showSidebar && <QuizCategoriesSidebar />}

        <main
          className={cn(
            'flex-1 transition-all duration-300 relative z-10',
            showSidebar && 'ml-64'
          )}
        >
          <div className="container mx-auto max-w-7xl py-8 px-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
