'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { QuestionData } from '@/types/game'

interface QuestionCardProps {
  questionData: QuestionData
  timeRemaining: number
  myAnswer: number | null
  correctAnswer?: number
  onAnswer?: (answer: number) => void
  disabled?: boolean
}

export function QuestionCard({
  questionData,
  timeRemaining,
  myAnswer,
  correctAnswer,
  onAnswer,
  disabled = false,
}: QuestionCardProps) {
  const { question, questionNumber, totalQuestions } = questionData
  const timePercentage = (timeRemaining / question.timeLimit) * 100

  const getButtonColor = (index: number) => {
    // Si la réponse correcte est révélée
    if (correctAnswer !== undefined) {
      if (index === correctAnswer) {
        return 'bg-green-500 text-white hover:bg-green-600 border-green-600'
      }
      if (index === myAnswer && myAnswer !== correctAnswer) {
        return 'bg-red-500 text-white hover:bg-red-600 border-red-600'
      }
      return 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-300'
    }

    // Si j'ai répondu
    if (myAnswer === index) {
      return 'bg-primary text-primary-foreground border-primary ring-2 ring-primary'
    }

    return 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Progress & Timer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {questionNumber} / {totalQuestions}
          </span>
          <span
            className={`font-bold ${
              timeRemaining <= 5 ? 'text-red-500' : 'text-primary'
            }`}
          >
            {timeRemaining}s
          </span>
        </div>
        <Progress
          value={timePercentage}
          className={`h-2 ${timeRemaining <= 5 ? 'bg-red-100' : ''}`}
        />
      </div>

      {/* Question Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold leading-tight">
              {question.text}
            </h2>
            <div className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              {question.points} pts
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => onAnswer && onAnswer(index)}
                disabled={disabled || myAnswer !== null}
                className={`group relative rounded-xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed ${getButtonColor(
                  index
                )}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold ${
                      correctAnswer !== undefined && index === correctAnswer
                        ? 'border-white bg-white text-green-600'
                        : myAnswer === index
                        ? 'border-current bg-current text-primary-foreground'
                        : 'border-gray-400 group-hover:border-primary'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1 font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
