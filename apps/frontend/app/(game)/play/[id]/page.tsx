'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { quizApi, type Question, type Quiz } from '@/lib/api/quiz'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function SoloPlayPage() {
  const params = useParams()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<(Quiz & { questions: Question[] }) | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(15)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const quizRef = useRef(quiz)
  const currentQuestionIndexRef = useRef(currentQuestionIndex)

  useEffect(() => {
    quizRef.current = quiz
    currentQuestionIndexRef.current = currentQuestionIndex
  }, [quiz, currentQuestionIndex])

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (showResult || !quiz) return

      const question = quiz.questions[currentQuestionIndex]
      if (!question) return

      // Stop the timer immediately
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // Get current time remaining before updating state
      setTimeRemaining(currentTime => {
        setSelectedAnswer(answerIndex)
        setShowResult(true)

        if (answerIndex === question.correctAnswer) {
          const points = currentTime * 10 // Points based on time remaining
          setScore(prev => prev + points)
        }

        return currentTime // Keep the time as is
      })
    },
    [showResult, quiz, currentQuestionIndex]
  )

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await quizApi.getQuiz(quizId)
        // Fetch questions separately
        const questions = await quizApi.getQuestions(quizId)
        setQuiz({ ...data, questions } as unknown as Quiz & {
          questions: Question[]
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz')
      } finally {
        setLoading(false)
      }
    }

    if (quizId) {
      fetchQuiz()
    }
  }, [quizId])

  useEffect(() => {
    if (!quiz || finished) return

    // Reset state for the new question
    const question = quiz.questions[currentQuestionIndex]
    if (!question) return

    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setTimeRemaining(15)
    setSelectedAnswer(null)
    setShowResult(false)

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          const question =
            quizRef.current?.questions[currentQuestionIndexRef.current]
          if (question) {
            setSelectedAnswer(-1)
            setShowResult(true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [currentQuestionIndex, quiz, finished])

  const handleNext = () => {
    if (!quiz) return

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setFinished(true)
    }
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setFinished(false)
    setTimeRemaining(15)
  }

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Loading quiz...</h2>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <h2 className="text-2xl font-bold">Quiz not found</h2>
            <p className="text-muted-foreground">
              {error || 'The quiz you are looking for does not exist.'}
            </p>
            <Button asChild className="mt-4">
              <Link href="/quizzes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Quizzes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="container mx-auto py-8">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="mb-4 text-4xl font-bold">Quiz Complete!</h1>
            <p className="mb-8 text-2xl text-muted-foreground">
              Your score:{' '}
              <span className="font-bold text-primary">{score}</span> points
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleRestart} size="lg">
                Play Again
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/quizzes">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Quizzes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = quiz.questions[currentQuestionIndex]
  if (!question) return null

  const options =
    typeof question.options === 'string'
      ? JSON.parse(question.options)
      : question.options

  const isCorrect = selectedAnswer === question.correctAnswer

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link href="/quizzes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </p>
          <p className="text-lg font-bold">Score: {score}</p>
        </div>
      </div>

      <Card className="mx-auto max-w-3xl">
        <CardContent className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{quiz.title}</h2>
            <div className="rounded-full bg-primary/10 px-4 py-2">
              <span className="font-bold text-primary">{timeRemaining}s</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-4 text-xl font-semibold">{question.text}</h3>
            <div className="space-y-3">
              {options.map((option: string, index: number) => {
                let buttonVariant: 'default' | 'destructive' | 'secondary' =
                  'default'
                if (showResult) {
                  if (index === question.correctAnswer) {
                    buttonVariant = 'default' // Green (correct)
                  } else if (
                    index === selectedAnswer &&
                    index !== question.correctAnswer
                  ) {
                    buttonVariant = 'destructive' // Red (wrong)
                  } else {
                    buttonVariant = 'secondary' // Gray (not selected)
                  }
                }

                return (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={showResult}
                    variant={buttonVariant}
                    className="w-full justify-start text-left h-auto py-4 px-4"
                    size="lg"
                  >
                    {option}
                  </Button>
                )
              })}
            </div>
          </div>

          {showResult && (
            <div className="mb-6 rounded-lg border p-4">
              {selectedAnswer === -1 ? (
                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  ⏱ Time&apos;s up! The correct answer was:{' '}
                  {options[question.correctAnswer]}
                </p>
              ) : isCorrect ? (
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  ✓ Correct! +{timeRemaining * 10} points
                </p>
              ) : (
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  ✗ Wrong! The correct answer was:{' '}
                  {options[question.correctAnswer]}
                </p>
              )}
            </div>
          )}

          {showResult && (
            <div className="flex justify-end">
              <Button onClick={handleNext} size="lg">
                {currentQuestionIndex < quiz.questions.length - 1
                  ? 'Next Question'
                  : 'Finish Quiz'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
