'use client'

import { useAuth } from '@/providers/auth.provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { quizApi } from '@/lib/api/quiz'
import { Loader2, Plus, TrendingUp, BookOpen, Edit } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  // Fetch user's recent quizzes
  const { data: myQuizzes, isLoading: loadingMyQuizzes } = useQuery({
    queryKey: ['my-quizzes', user?.id],
    queryFn: () => quizApi.getQuizzes({
      authorId: user?.id,
      limit: 5,
      page: 1
    }),
    enabled: !!user?.id,
  })

  // Fetch popular public quizzes
  const { data: popularQuizzes, isLoading: loadingPopular } = useQuery({
    queryKey: ['popular-quizzes'],
    queryFn: () => quizApi.getQuizzes({
      isPublic: true,
      limit: 5,
      page: 1
    }),
  })

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Welcome, {user?.name || user?.email}</h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Manage your quizzes and track your progress
          </p>
        </div>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button onClick={() => router.push('/quiz/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Quiz
        </Button>
        <Button onClick={() => router.push('/quiz')} variant="outline" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Browse All Quizzes
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myQuizzes?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total quizzes created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.planType || 'FREE'}</div>
            <p className="text-xs text-muted-foreground">
              Current plan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myQuizzes?.quizzes.filter(q => q.isPublic).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Shared with community
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">{user?.email}</div>
            <p className="text-xs text-muted-foreground">
              {user?.role || 'USER'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Recent Quizzes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Recent Quizzes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/quiz')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMyQuizzes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : myQuizzes?.quizzes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven&apos;t created any quizzes yet.</p>
              <Button onClick={() => router.push('/quiz/create')} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myQuizzes?.quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {quiz.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                        {quiz.difficulty}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-secondary">
                        {quiz.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/quiz/${quiz.id}/edit`)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Quizzes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Popular Quizzes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/quiz')}
            >
              Explore More
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPopular ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {popularQuizzes?.quizzes.slice(0, 5).map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/quiz/${quiz.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {quiz.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                        {quiz.difficulty}
                      </span>
                      {quiz.category && (
                        <span className="text-xs px-2 py-1 rounded bg-secondary">
                          {quiz.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
