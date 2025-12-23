'use client'

import Link from 'next/link'
import { useAuth } from '@/providers/auth.provider'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LogOut, User } from 'lucide-react'

export function MainNav() {
  const { user, logout } = useAuth()

  return (
    <>
      {/* Main Header */}
      <nav className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-xl font-bold hover:text-primary transition-colors flex items-center gap-2"
            >
              <span className="text-2xl">FQ</span>
              <span>FastQuizParty</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>

                <ThemeToggle />

                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Sub Navigation - Always Visible */}
      <div className="border-b bg-slate-50 dark:bg-gray-800 dark:border-gray-700 border-t-0 fixed top-[57px] left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-3 flex gap-6">
          <Link
            href="/quizzes"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Quizzes
          </Link>
          <Link
            href="/quizzes/create"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Create Quiz
          </Link>
          <Link
            href="/rooms"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Rooms
          </Link>
          <Link
            href="/play"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Play
          </Link>
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="text-sm font-medium hover:text-primary transition-colors text-red-600"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
