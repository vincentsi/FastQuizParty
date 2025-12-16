'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, Award, Home, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import type { LeaderboardEntry } from '@/types/game'

interface ResultsPageProps {
  leaderboard: LeaderboardEntry[]
  myPlayerId?: string
  duration: number
  onPlayAgain?: () => void
}

export function ResultsPage({
  leaderboard,
  myPlayerId,
  duration,
  onPlayAgain
}: ResultsPageProps) {
  const topThree = leaderboard.slice(0, 3)
  const myRank = leaderboard.find(entry => entry.playerId === myPlayerId)

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1:
        return 'h-32'
      case 2:
        return 'h-24'
      case 3:
        return 'h-20'
      default:
        return 'h-16'
    }
  }

  const getPodiumIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-8 w-8 text-yellow-500" />
      case 2:
        return <Medal className="h-8 w-8 text-gray-400" />
      case 3:
        return <Award className="h-8 w-8 text-orange-600" />
      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold">Game Over!</h1>
        <p className="mt-2 text-muted-foreground">
          Duration: {formatDuration(duration)}
        </p>
      </div>

      {/* Podium */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Top 3 Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-center gap-4">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="flex flex-col items-center">
                <div className="mb-2">{getPodiumIcon(2)}</div>
                <div className="text-center">
                  <p className="font-semibold">{topThree[1].username}</p>
                  <p className="text-2xl font-bold text-primary">
                    {topThree[1].score}
                  </p>
                </div>
                <div
                  className={`${getPodiumHeight(2)} mt-2 w-24 rounded-t-lg bg-gray-400 dark:bg-gray-600`}
                />
                <div className="mt-1 text-sm font-semibold text-gray-500">2nd</div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="flex flex-col items-center">
                <div className="mb-2">{getPodiumIcon(1)}</div>
                <div className="text-center">
                  <p className="font-semibold">{topThree[0].username}</p>
                  <p className="text-3xl font-bold text-primary">
                    {topThree[0].score}
                  </p>
                </div>
                <div
                  className={`${getPodiumHeight(1)} mt-2 w-24 rounded-t-lg bg-yellow-500 dark:bg-yellow-600`}
                />
                <div className="mt-1 text-sm font-semibold text-yellow-600">1st</div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="flex flex-col items-center">
                <div className="mb-2">{getPodiumIcon(3)}</div>
                <div className="text-center">
                  <p className="font-semibold">{topThree[2].username}</p>
                  <p className="text-2xl font-bold text-primary">
                    {topThree[2].score}
                  </p>
                </div>
                <div
                  className={`${getPodiumHeight(3)} mt-2 w-24 rounded-t-lg bg-orange-600 dark:bg-orange-700`}
                />
                <div className="mt-1 text-sm font-semibold text-orange-600">3rd</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Final Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((entry) => {
              const isMe = entry.playerId === myPlayerId
              const isTop3 = entry.rank <= 3

              return (
                <div
                  key={entry.playerId}
                  className={`flex items-center justify-between rounded-lg border-2 p-3 ${
                    isMe
                      ? 'border-primary bg-primary/5'
                      : isTop3
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <span className="font-bold">#{entry.rank}</span>
                    </div>
                    <div>
                      <p className="font-semibold">
                        {entry.username}
                        {isMe && (
                          <span className="ml-2 text-xs text-primary">(You)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{entry.score}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* My Stats */}
      {myRank && (
        <Card>
          <CardHeader>
            <CardTitle>Your Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Final Rank</p>
                <p className="text-3xl font-bold text-primary">#{myRank.rank}</p>
              </div>
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-3xl font-bold text-primary">{myRank.score}</p>
              </div>
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Players</p>
                <p className="text-3xl font-bold text-primary">{leaderboard.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        {onPlayAgain && (
          <Button size="lg" onClick={onPlayAgain} className="gap-2">
            <RotateCcw className="h-5 w-5" />
            Play Again
          </Button>
        )}
        <Button size="lg" variant="outline" asChild className="gap-2">
          <Link href="/dashboard">
            <Home className="h-5 w-5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
