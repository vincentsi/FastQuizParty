'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRoom } from '@/lib/hooks/useRoom'
import { useSocket } from '@/lib/socket/socket-context'
import { useAuth } from '@/providers/auth.provider'
import { RoomLobby } from '@/components/room'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function RoomPage() {
  const router = useRouter()

  const { user } = useAuth()
  const { isConnected, connect } = useSocket()
  const { room, currentPlayer, toggleReady, startGame, leaveRoom, isLoading } = useRoom()

  // Connect socket on mount
  useEffect(() => {
    if (user && !isConnected) {
      // Get access token from cookies or auth context
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('accessToken='))
        ?.split('=')[1]

      if (token) {
        connect(token)
      }
    }
  }, [user, isConnected, connect])

  // Handle ready toggle
  const handleReady = async () => {
    await toggleReady()
  }

  // Handle start game
  const handleStart = async () => {
    const success = await startGame()
    if (success) {
      // Navigate to game page when game starts
      router.push(`/play/${room?.quizId}`)
    }
  }

  // Handle leave room
  const handleLeave = async () => {
    const success = await leaveRoom()
    if (success) {
      router.push('/quizzes')
    }
  }

  // Loading state
  if (!isConnected) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Connecting to server...</p>
        </div>
      </div>
    )
  }

  // Room not found or not in room
  if (!room || !currentPlayer) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-8">
        <div className="text-center">
          <p className="text-lg text-destructive">Room not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The room may have been closed or the code is invalid.
          </p>
          <Button asChild className="mt-4">
            <a href="/quizzes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quizzes
            </a>
          </Button>
        </div>
      </div>
    )
  }

  // Show lobby
  return (
    <RoomLobby
      room={room}
      currentPlayer={currentPlayer}
      onReady={handleReady}
      onStart={handleStart}
      onLeave={handleLeave}
      isLoading={isLoading}
    />
  )
}
