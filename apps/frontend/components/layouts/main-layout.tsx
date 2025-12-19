'use client'

import { MainNav } from './main-nav'
import { QuizCategoriesSidebar } from './quiz-categories-sidebar'
import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
  showSidebar?: boolean
}

export function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <MainNav />

      <div className="flex pt-[73px]">
        {showSidebar && (
          <QuizCategoriesSidebar
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        <main
          className={cn(
            'flex-1 transition-all duration-300',
            showSidebar && (sidebarCollapsed ? 'ml-16' : 'ml-64')
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
