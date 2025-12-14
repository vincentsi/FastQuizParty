'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { quizApi } from '@/lib/api/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Clock, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { CreateRoomDialog } from '@/components/room'

export default function QuizDetailPage() {
  const params = useParams()
  const quizId = params.id as string

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizApi.getQuiz(quizId),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-8">
        <div className="text-center">
          <p className="text-lg text-destructive">Failed to load quiz</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Quiz not found'}
          </p>
          <Button asChild className="mt-4">
            <Link href="/quizzes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quizzes
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const difficultyColors = {
    EASY: 'bg-green-500/10 text-green-500',
    MEDIUM: 'bg-yellow-500/10 text-yellow-500',
    HARD: 'bg-red-500/10 text-red-500',
    MIXED: 'bg-blue-500/10 text-blue-500',
  }

  const questionCount = quiz.questions?.length || 0
  const totalTime = quiz.questions?.reduce((acc, q) => acc + q.timeLimit, 0) || 0

  return (
    <div className="container mx-auto py-8">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/quizzes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quizzes
        </Link>
      </Button>

      {/* Quiz Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          {quiz.category?.icon && (
            <div className="text-6xl">{quiz.category.icon}</div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold">{quiz.title}</h1>
            {quiz.description && (
              <p className="mt-2 text-lg text-muted-foreground">
                {quiz.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className={difficultyColors[quiz.difficulty]}>
                {quiz.difficulty}
              </Badge>

              {quiz.isPremium && (
                <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
                  Premium
                </Badge>
              )}

              {quiz.isAiGenerated && (
                <Badge variant="outline">AI Generated</Badge>
              )}

              {quiz.category && (
                <Badge variant="outline">{quiz.category.name}</Badge>
              )}
            </div>

            {quiz.tags && quiz.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {quiz.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questionCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Est. Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {Math.ceil(totalTime / 60)} min
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Plays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{quiz.playCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        <CreateRoomDialog
          quizId={quiz.id}
          trigger={
            <Button size="lg" variant="default">
              <Users className="mr-2 h-5 w-5" />
              Create Room
            </Button>
          }
        />
        <Button size="lg" variant="outline" asChild>
          <Link href={`/play/${quiz.id}`}>
            <Play className="mr-2 h-5 w-5" />
            Solo Play
          </Link>
        </Button>
      </div>

      {/* Questions Preview */}
      {quiz.questions && quiz.questions.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Questions Preview</h2>
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {index + 1}. {question.text}
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`rounded-full px-2 py-0.5 ${difficultyColors[question.difficulty]}`}>
                        {question.difficulty}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {question.timeLimit}s
                      </span>
                      <span>{question.points} pts</span>
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
