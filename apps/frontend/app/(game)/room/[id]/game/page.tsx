'use client'

import { useGame } from '@/lib/hooks/useGame'
import { GamePhase } from '@/types/game'
import { Countdown } from '@/components/game/countdown'
import { QuestionCard } from '@/components/game/question-card'
import { Scoreboard } from '@/components/game/scoreboard'
import { AnswerReveal } from '@/components/game/answer-reveal'
import { ResultsPage } from '@/components/game/results-page'
import { useAuth } from '@/providers/auth.provider'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function GamePage() {
  const { user } = useAuth()
  const { gameState, submitAnswer } = useGame()

  const handleAnswer = async (answer: number) => {
    await submitAnswer(answer)
  }

  // Waiting for game to start
  if (gameState.phase === GamePhase.WAITING) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Waiting for game to start...</h2>
            <p className="text-center text-muted-foreground">
              The host will start the game soon. Get ready!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Countdown phase
  if (gameState.phase === GamePhase.COUNTDOWN && gameState.countdown !== null) {
    return <Countdown count={gameState.countdown} />
  }

  // Question phase
  if (gameState.phase === GamePhase.QUESTION && gameState.currentQuestion) {
    return (
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <QuestionCard
            questionData={gameState.currentQuestion}
            timeRemaining={gameState.timeRemaining}
            myAnswer={gameState.myAnswer}
            onAnswer={handleAnswer}
            disabled={!gameState.canAnswer}
          />
        </div>
        <div>
          <Scoreboard
            leaderboard={gameState.leaderboard}
            highlightPlayerId={user?.id}
          />
        </div>

        {/* Answer reveal overlay */}
        {gameState.answerResult && (
          <AnswerReveal result={gameState.answerResult} />
        )}
      </div>
    )
  }

  // Answer reveal phase
  if (gameState.phase === GamePhase.ANSWER_REVEAL && gameState.currentQuestion) {
    return (
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <QuestionCard
            questionData={gameState.currentQuestion}
            timeRemaining={0}
            myAnswer={gameState.myAnswer}
            correctAnswer={gameState.answerResult?.correctAnswer}
            disabled
          />
        </div>
        <div>
          <Scoreboard
            leaderboard={gameState.leaderboard}
            highlightPlayerId={user?.id}
          />
        </div>
      </div>
    )
  }

  // Scoreboard phase (between questions)
  if (gameState.phase === GamePhase.SCOREBOARD) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold">Current Standings</h2>
          <p className="mt-2 text-muted-foreground">
            Next question coming soon...
          </p>
        </div>
        <Scoreboard
          leaderboard={gameState.leaderboard}
          highlightPlayerId={user?.id}
        />
      </div>
    )
  }

  // Game finished
  if (gameState.phase === GamePhase.FINISHED) {
    return (
      <ResultsPage
        leaderboard={gameState.leaderboard}
        myPlayerId={user?.id}
        duration={0} // This should come from the game:finished event
      />
    )
  }

  // Fallback
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-2xl font-bold">Loading game...</h2>
        </CardContent>
      </Card>
    </div>
  )
}
