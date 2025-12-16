'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Award } from 'lucide-react'
import type { LeaderboardEntry } from '@/types/game'

interface ScoreboardProps {
  leaderboard: LeaderboardEntry[]
  highlightPlayerId?: string
  showTop?: number
}

export function Scoreboard({
  leaderboard,
  highlightPlayerId,
  showTop = 10
}: ScoreboardProps) {
  const displayedLeaderboard = leaderboard.slice(0, showTop)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />
      default:
        return null
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500'
      case 2:
        return 'bg-gray-50 dark:bg-gray-900 border-gray-400'
      case 3:
        return 'bg-orange-50 dark:bg-orange-950 border-orange-600'
      default:
        return 'bg-white dark:bg-gray-950'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayedLeaderboard.map((entry) => {
            const isHighlighted = entry.playerId === highlightPlayerId
            const rankIcon = getRankIcon(entry.rank)
            const rankColor = getRankColor(entry.rank)

            return (
              <div
                key={entry.playerId}
                className={`flex items-center justify-between rounded-lg border-2 p-3 transition-all ${
                  isHighlighted
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : rankColor
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center">
                    {rankIcon || (
                      <span className="text-sm font-semibold text-muted-foreground">
                        #{entry.rank}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {entry.username}
                      {isHighlighted && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{entry.score}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
