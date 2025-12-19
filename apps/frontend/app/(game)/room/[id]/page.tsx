'use client'

import { RoomLobby } from '@/components/room'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import { useRoom } from '@/lib/hooks/useRoom'
import { useSocket } from '@/lib/socket/socket-context'
import { ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function RoomPage() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.id as string

  const { isConnected, connect } = useSocket()
  const {
    room,
    currentPlayer,
    toggleReady,
    startGame,
    leaveRoom,
    isLoading,
    rejoinRoom,
  } = useRoom()
  const [hasTriedJoin, setHasTriedJoin] = useState(false)
  const [isRejoining, setIsRejoining] = useState(false)

  // Connect socket on mount (allow guest with empty token)
  useEffect(() => {
    if (!isConnected) {
      const token =
        document.cookie
          .split('; ')
          .find(row => row.startsWith('accessToken='))
          ?.split('=')[1] || ''

      connect(token)
    }
  }, [isConnected, connect])

  // Check sessionStorage for room state (from creation or refresh)
  // Don't restore state - let auto-rejoin handle it
  useEffect(() => {
    if (!room && roomCode) {
      const storedRoomId = sessionStorage.getItem('currentRoomId')

      // Clean up mismatched sessionStorage
      if (storedRoomId && storedRoomId !== roomCode) {
        sessionStorage.removeItem('currentRoomId')
        sessionStorage.removeItem('currentPlayerId')
        sessionStorage.removeItem(`room:${storedRoomId}`)
      }
    }
  }, [roomCode, room])

  // Auto-rejoin room when connected and not already in room
  useEffect(() => {
    const storedRoomId = sessionStorage.getItem('currentRoomId')
    const storedPlayerId = sessionStorage.getItem('currentPlayerId')

    // Only attempt rejoin if:
    // 1. Socket is connected
    // 2. Haven't tried joining yet
    // 3. No room state exists (fresh page load or refresh)
    // 4. Have stored session data (this was a refresh, not a new visit)
    const shouldRejoin =
      isConnected &&
      !hasTriedJoin &&
      !room &&
      storedRoomId === roomCode &&
      storedPlayerId

    if (shouldRejoin) {
      setHasTriedJoin(true)
      setIsRejoining(true)

      // Get stored room data to retrieve username
      const storedRoomData = sessionStorage.getItem(`room:${roomCode}`)
      let storedUsername: string | undefined

      if (storedRoomData) {
        try {
          const parsed = JSON.parse(storedRoomData)
          const player = parsed.room?.players?.find((p: { id: string }) => p.id === storedPlayerId)
          storedUsername = player?.username
        } catch {
          // Ignore parse errors
        }
      }

      // Fetch room code from API, then rejoin
      apiClient
        .get<{
          success: boolean
          data?: { code: string; isPrivate: boolean }
          error?: string
        }>(`/api/rooms/${roomCode}/code`)
        .then(response => {
          if (response.data.success && response.data.data?.code) {
            return rejoinRoom({
              code: response.data.data.code,
              username: storedUsername, // Send stored username to match existing player
            })
          } else {
            throw new Error(response.data.error || 'Room not found')
          }
        })
        .then(result => {
          setIsRejoining(false)
          if (!result) {
            // Rejoin failed - clear sessionStorage
            sessionStorage.removeItem('currentRoomId')
            sessionStorage.removeItem('currentPlayerId')
            sessionStorage.removeItem(`room:${roomCode}`)
          }
        })
        .catch(() => {
          setIsRejoining(false)
          // Clear stale sessionStorage
          sessionStorage.removeItem('currentRoomId')
          sessionStorage.removeItem('currentPlayerId')
          sessionStorage.removeItem(`room:${roomCode}`)
        })
    }
  }, [isConnected, room, hasTriedJoin, roomCode, rejoinRoom])

  // Handle ready toggle
  const handleReady = async () => {
    await toggleReady()
  }

  // Handle start game
  const handleStart = async () => {
    const success = await startGame()
    if (success) {
      // Navigate to game page when game starts
      router.push(`/room/${room?.id}/game`)
    }
  }

  // Handle leave room
  const handleLeave = async () => {
    const success = await leaveRoom()
    if (success) {
      router.push('/quizzes')
    }
  }

  // Listen for game starting event and redirect all players
  useEffect(() => {
    if (!room || room.status !== 'STARTING') return

    // When game status changes to STARTING, redirect to game page
    router.push(`/room/${room.id}/game`)
  }, [room, router])

  // Loading state - connecting to server
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

  // Loading state - rejoining room after refresh
  if (isRejoining) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Rejoining room...</p>
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

  return (
    <RoomLobby
      room={room}
      currentPlayer={currentPlayer}
      onReady={handleReady}
      onStart={handleStart}
      onLeave={handleLeave}
      isLoading={isLoading || isRejoining}
    />
  )
}
