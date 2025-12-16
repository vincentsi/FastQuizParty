'use client'

import { CreateRoomDialog } from '@/components/room'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { quizApi } from '@/lib/api/quiz'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Clock,
  Play,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function QuizDetailPage() {
  const params = useParams()
  const quizId = params.id as string

  const {
    data: quiz,
    isLoading,
    error,
  } = useQuery({
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
  const totalTime =
    quiz.questions?.reduce((acc, q) => acc + q.timeLimit, 0) || 0

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.35),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(236,72,153,0.35),transparent_30%)]" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-white/10 text-white" variant="secondary">
              {quiz.category?.name || 'Quiz'}
            </Badge>
            <Badge
              className={difficultyColors[quiz.difficulty]}
              variant="secondary"
            >
              {quiz.difficulty}
            </Badge>
            {quiz.isPremium && (
              <Badge
                variant="default"
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                Premium
              </Badge>
            )}
            {quiz.isAiGenerated && (
              <Badge variant="outline" className="border-white/30 text-white">
                AI Generated
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="max-w-3xl text-base text-white/80">
                {quiz.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {quiz.tags?.map(tag => (
              <span
                key={tag}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/80"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <CreateRoomDialog
              quizId={quiz.id}
              trigger={
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-slate-900"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Create Room
                </Button>
              }
            />
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/30 bg-transparent text-white hover:bg-white/20 hover:text-white"
            >
              <Link href={`/play/${quiz.id}`}>
                <Play className="mr-2 h-5 w-5" />
                Solo Play
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <Link href="/quizzes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Quizzes
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <CardDescription>Total number of questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{questionCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Est. Time</CardTitle>
            <CardDescription>Based on question timers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="text-3xl font-bold">
                {Math.ceil(totalTime / 60)} min
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Plays</CardTitle>
            <CardDescription>How many times it was played</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div className="text-3xl font-bold">{quiz.playCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {quiz.questions && quiz.questions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold">Questions Preview</h2>
          </div>
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <Card key={question.id} className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    {index + 1}. {question.text}
                  </CardTitle>
                  <CardDescription>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span
                        className={`rounded-full px-2 py-0.5 ${difficultyColors[question.difficulty]}`}
                      >
                        {question.difficulty}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <Clock className="h-3 w-3" />
                        {question.timeLimit}s
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        {question.points} pts
                      </span>
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
