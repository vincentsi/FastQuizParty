'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/providers/auth.provider'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LogOut, User, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MainNav() {
  const { user, logout } = useAuth()
  const [showSubNav, setShowSubNav] = useState(false)

  return (
    <>
      {/* Main Header */}
      <nav className="border-b bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setShowSubNav(!showSubNav)}
              className="text-xl font-bold hover:text-primary transition-colors flex items-center gap-2"
            >
              <span className="text-2xl">FQ</span>
              <span>FastQuizParty</span>
              {showSubNav ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
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

      {/* Sub Navigation */}
      <div
        className={cn(
          'border-b bg-slate-50 dark:bg-gray-800 dark:border-gray-700 overflow-hidden transition-all duration-300',
          showSubNav ? 'max-h-16' : 'max-h-0'
        )}
      >
        <div className="container mx-auto px-4 py-4 flex gap-6">
          <Link
            href="/quizzes"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Quizzes
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
