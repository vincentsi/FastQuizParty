'use client'

import Link from 'next/link'
import { memo } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Quiz } from '@/lib/api/quiz'
import { Clock, TrendingUp, Users } from 'lucide-react'

interface QuizCardProps {
  quiz: Quiz
}

const QuizCardComponent = ({ quiz }: QuizCardProps) => {
  const questionCount = quiz._count?.questions || quiz.questions?.length || 0

  const difficultyColors = {
    EASY: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
    HARD: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
    MIXED: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  }

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
            {quiz.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {quiz.description}
              </CardDescription>
            )}
          </div>
          {quiz.category?.icon && (
            <div className="text-3xl" title={quiz.category.name}>
              {quiz.category.icon}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={difficultyColors[quiz.difficulty]}>
            {quiz.difficulty}
          </Badge>

          {quiz.isPremium && (
            <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
              Premium
            </Badge>
          )}

          {quiz.isAiGenerated && (
            <Badge variant="outline">
              AI Generated
            </Badge>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{questionCount} questions</span>
          </div>

          {quiz.playCount > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{quiz.playCount} plays</span>
            </div>
          )}
        </div>

        {quiz.tags && quiz.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {quiz.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
            {quiz.tags.length > 3 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                +{quiz.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button asChild className="flex-1">
          <Link href={`/quiz/${quiz.id}`} prefetch={true}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Play Quiz
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export const QuizCard = memo(QuizCardComponent)
