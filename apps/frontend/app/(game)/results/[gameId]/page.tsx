'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ResultsPage } from '@/components/game/results-page'
import type { LeaderboardEntry } from '@/types/game'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function ResultsStandalonePage() {
  const params = useParams()
  const gameId = params.gameId as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/games/${gameId}/results`)
        if (!res.ok) {
          throw new Error('Results not found')
        }
        const response = await res.json()
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to load results')
        }
        setLeaderboard(response.data.leaderboard || [])
        setDuration(response.data.duration ?? 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load results')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [gameId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Loading results...</h2>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <h2 className="text-2xl font-bold">Results unavailable</h2>
            <p className="text-muted-foreground">{error}</p>
            <p
              className="cursor-pointer text-primary underline"
              onClick={() => router.push('/')}
            >
              Back to home
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ResultsPage leaderboard={leaderboard} duration={duration} />
  )
}

