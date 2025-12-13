'use client'

import { QuizCard } from './quiz-card'
import type { Quiz } from '@/lib/api/quiz'

interface QuizListProps {
  quizzes: Quiz[]
  emptyMessage?: string
}

export function QuizList({ quizzes, emptyMessage = 'No quizzes found' }: QuizListProps) {
  if (quizzes.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {quizzes.map((quiz) => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  )
}
