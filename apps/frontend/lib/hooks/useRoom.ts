'use client'

import { useSocket } from '@/lib/socket/socket-context'
import type {
  Player,
  Room,
  RoomCreateDto,
  RoomJoinDto,
  RoomListItem,
} from '@/types/room'
import { GameStatus } from '@/types/room'
import { useCallback, useEffect, useRef, useState } from 'react'

interface SocketResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * useRoom Hook
 *
 * Manages room state and Socket.IO events for game rooms
 */
export function useRoom() {
  const { socket, isConnected } = useSocket()
  const [room, setRoom] = useState<Room | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [publicRooms, setPublicRooms] = useState<RoomListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchPublicRoomsRef = useRef<
    (() => Promise<RoomListItem[]>) | undefined
  >(undefined)
  const isJoiningRef = useRef(false) // Track if we're currently joining to ignore room:updated

  /**
   * Create a new room
   */
  const createRoom = useCallback(
    async (data: RoomCreateDto): Promise<Room | null> => {
      if (!socket || !isConnected) {
        setError('Socket not connected')
        return null
      }

      setIsLoading(true)
      setError(null)

      return new Promise(resolve => {
        socket.emit('room:create', data, (response: SocketResponse<Room>) => {
          setIsLoading(false)

          if (response.success && response.data) {
            setRoom(response.data)
            // Find current player (host)
            const host = response.data.players.find(p => p.isHost)
            if (host) {
              setCurrentPlayer(host)
            }
            resolve(response.data)
          } else {
            setError(response.error || 'Failed to create room')
            resolve(null)
          }
        })
      })
    },
    [socket, isConnected]
  )

  /**
   * Join an existing room
   */
  const joinRoom = useCallback(
    async (
      data: RoomJoinDto
    ): Promise<{ room: Room; player: Player } | null> => {
      if (!socket || !isConnected) {
        setError('Socket not connected')
        return null
      }

      setIsLoading(true)
      setError(null)

      return new Promise(resolve => {
        // Mark that we're joining to prevent room:updated from interfering
        isJoiningRef.current = true

        const timeout = setTimeout(() => {
          setIsLoading(false)
          isJoiningRef.current = false

          // Clear stale sessionStorage on timeout
          const storedRoomId = sessionStorage.getItem('currentRoomId')
          if (storedRoomId) {
            sessionStorage.removeItem('currentRoomId')
            sessionStorage.removeItem('currentPlayerId')
            sessionStorage.removeItem(`room:${storedRoomId}`)
          }

          setError('Connection timeout. Please try again.')
          resolve(null)
        }, 10000) // 10 second timeout

        socket.emit(
          'room:join',
          data,
          (response: SocketResponse<{ room: Room; player: Player }>) => {
            clearTimeout(timeout)
            setIsLoading(false)

            if (response?.success && response.data) {
              const { room: joinedRoom, player: joinedPlayer } = response.data

              setRoom(joinedRoom)
              setCurrentPlayer(joinedPlayer)

              // Store in sessionStorage for navigation and refresh recovery
              sessionStorage.setItem(
                `room:${joinedRoom.id}`,
                JSON.stringify({
                  room: joinedRoom,
                  playerId: joinedPlayer.id,
                })
              )
              // Also store roomId and playerId for refresh recovery
              sessionStorage.setItem('currentRoomId', joinedRoom.id)
              sessionStorage.setItem('currentPlayerId', joinedPlayer.id)

              // Mark that we're done joining - allow room:updated to update now
              setTimeout(() => {
                isJoiningRef.current = false
              }, 100) // Reduced delay to match backend Redis save delay

              resolve(response.data)
            } else {
              const errorMsg = response?.error || 'Failed to join room'
              setError(errorMsg)
              resolve(null)
            }
          }
        )
      })
    },
    [socket, isConnected]
  )

  /**
   * Rejoin an existing room (after page refresh)
   * This is semantically the same as joinRoom but with better logging
   */
  const rejoinRoom = useCallback(
    async (
      data: RoomJoinDto
    ): Promise<{ room: Room; player: Player } | null> => {
      return joinRoom(data)
    },
    [joinRoom]
  )

  /**
   * Leave current room
   */
  const leaveRoom = useCallback(async (): Promise<boolean> => {
    if (!socket || !isConnected) {
      return false
    }

    setIsLoading(true)

    return new Promise(resolve => {
      socket.emit('room:leave', (response: SocketResponse) => {
        setIsLoading(false)

        if (response.success) {
          setRoom(null)
          setCurrentPlayer(null)
          // Clear sessionStorage when leaving
          const roomId = sessionStorage.getItem('currentRoomId')
          if (roomId) {
            sessionStorage.removeItem(`room:${roomId}`)
            sessionStorage.removeItem('currentRoomId')
            sessionStorage.removeItem('currentPlayerId')
          }
          resolve(true)
        } else {
          setError(response.error || 'Failed to leave room')
          resolve(false)
        }
      })
    })
  }, [socket, isConnected])

  /**
   * Toggle ready status
   */
  const toggleReady = useCallback(async (): Promise<boolean> => {
    if (!socket || !isConnected || !room || !currentPlayer) {
      return false
    }

    // Don't allow host to toggle ready (host is always ready)
    if (currentPlayer.isHost) {
      return false
    }

    // Ensure player is connected
    if (!currentPlayer.isConnected) {
      return false
    }

    setIsLoading(true)

    return new Promise(resolve => {
      socket.emit(
        'room:ready',
        (response: SocketResponse<{ isReady: boolean }>) => {
          setIsLoading(false)

          if (response.success) {
            const newReadyStatus =
              response.data?.isReady ?? !currentPlayer.isReady
            setCurrentPlayer(prev => {
              if (!prev) return prev
              return { ...prev, isReady: newReadyStatus }
            })
            resolve(true)
          } else {
            setError(response.error || 'Failed to toggle ready')
            resolve(false)
          }
        }
      )
    })
  }, [socket, isConnected, room, currentPlayer])

  /**
   * Start game (host only)
   */
  const startGame = useCallback(async (): Promise<boolean> => {
    if (!socket || !isConnected) {
      return false
    }

    setIsLoading(true)

    return new Promise(resolve => {
      socket.emit('room:start', (response: SocketResponse) => {
        setIsLoading(false)

        if (response.success) {
          resolve(true)
        } else {
          setError(response.error || 'Failed to start game')
          resolve(false)
        }
      })
    })
  }, [socket, isConnected])

  /**
   * Get list of public rooms
   */
  const fetchPublicRooms = useCallback(async (): Promise<RoomListItem[]> => {
    if (!socket || !isConnected) {
      return []
    }

    return new Promise(resolve => {
      socket.emit('room:list', (response: SocketResponse<RoomListItem[]>) => {
        if (response.success && response.data) {
          setPublicRooms(response.data)
          resolve(response.data)
        } else {
          resolve([])
        }
      })
    })
  }, [socket, isConnected])

  // Keep ref updated with latest fetchPublicRooms
  useEffect(() => {
    fetchPublicRoomsRef.current = fetchPublicRooms
  }, [fetchPublicRooms])

  // Event listeners for room updates
  useEffect(() => {
    if (!socket) return

    // NOTE: We don't handle room:player:joined anymore
    // The room:updated event handles all state synchronization
    // This prevents race conditions and duplicate players

    // Player left
    socket.on(
      'room:player:left',
      (data: { playerId: string; playerCount: number }) => {
        setRoom(prev => {
          if (!prev) return prev
          return {
            ...prev,
            players: prev.players.filter(p => p.id !== data.playerId),
          }
        })
      }
    )

    // Player disconnected
    socket.on(
      'room:player:disconnected',
      (data: { playerId: string; playerCount: number }) => {
        setRoom(prev => {
          if (!prev) return prev
          return {
            ...prev,
            players: prev.players.map(p =>
              p.id === data.playerId ? { ...p, isConnected: false } : p
            ),
          }
        })
      }
    )

    // Player ready status changed
    socket.on(
      'room:player:ready',
      (data: { playerId: string; isReady: boolean }) => {
        setRoom(prev => {
          if (!prev) return prev
          return {
            ...prev,
            players: prev.players.map(p =>
              p.id === data.playerId ? { ...p, isReady: data.isReady } : p
            ),
          }
        })

        // Update current player if it's us
        setCurrentPlayer(prev => {
          if (prev?.id === data.playerId) {
            return { ...prev, isReady: data.isReady }
          }
          return prev
        })
      }
    )

    // Game starting
    socket.on(
      'room:game:starting',
      (data: { roomId: string; players: Player[]; startedAt: number }) => {
        setRoom(prev => {
          if (!prev) return prev
          return {
            ...prev,
            status: GameStatus.STARTING,
            startedAt: data.startedAt,
          }
        })
      }
    )

    // Room deleted
    socket.on('room:deleted', () => {
      setRoom(null)
      setCurrentPlayer(null)
      setError('Room has been closed')
    })

    // Full room state update (for sync after reconnect/refresh)
    socket.on('room:updated', (data: { room: Room }) => {
      // Ignore room:updated if we're currently joining (to avoid race condition)
      if (isJoiningRef.current) {
        return
      }

      setRoom(data.room)

      // Update current player - try to find by stored playerId first, then by prevPlayer.id
      setCurrentPlayer(prevPlayer => {
        // Try to get stored playerId from sessionStorage
        const storedPlayerId = sessionStorage.getItem('currentPlayerId')
        const playerIdToFind = storedPlayerId || prevPlayer?.id

        if (playerIdToFind) {
          const updatedPlayer = data.room.players.find(
            p => p.id === playerIdToFind
          )
          if (updatedPlayer) {
            // Update stored playerId if found
            if (updatedPlayer.id !== storedPlayerId) {
              sessionStorage.setItem('currentPlayerId', updatedPlayer.id)
            }
            return updatedPlayer
          }
        }

        // Fallback: if we had a prevPlayer, try to find it
        if (prevPlayer) {
          const updatedPlayer = data.room.players.find(
            p => p.id === prevPlayer.id
          )
          if (updatedPlayer) {
            return updatedPlayer
          }
        }

        return prevPlayer
      })
    })

    // Public rooms list updated
    socket.on('room:list:updated', () => {
      fetchPublicRoomsRef.current?.()
    })

    return () => {
      socket.off('room:updated')
      socket.off('room:player:left')
      socket.off('room:player:disconnected')
      socket.off('room:player:ready')
      socket.off('room:game:starting')
      socket.off('room:deleted')
      socket.off('room:list:updated')
    }
  }, [socket]) // Removed fetchPublicRooms from deps to prevent infinite loop

  return {
    room,
    currentPlayer,
    publicRooms,
    isLoading,
    error,
    createRoom,
    joinRoom,
    rejoinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    fetchPublicRooms,
    setRoom,
    setCurrentPlayer,
  }
}
