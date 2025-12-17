'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PublicRoomsList, JoinRoomDialog } from '@/components/room'
import { useSocket } from '@/lib/socket/socket-context'
import { useAuth } from '@/providers/auth.provider'
import { useRoom } from '@/lib/hooks/useRoom'
import { RefreshCw } from 'lucide-react'
import { useRoom } from '@/lib/hooks/useRoom'

export const dynamic = 'force-dynamic'

export default function RoomsPage() {
  const { user } = useAuth()
  const { isConnected, connect } = useSocket()
  const { fetchPublicRooms } = useRoom()

  // Connect socket on mount (guest-friendly)
  useEffect(() => {
    if (!isConnected) {
      const token =
        document.cookie
          .split('; ')
          .find((row) => row.startsWith('accessToken='))
          ?.split('=')[1] || ''

      connect(token)
    }
  }, [isConnected, connect])

  const handleRefresh = () => {
    fetchPublicRooms()
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Public Rooms</h1>
          <p className="mt-2 text-muted-foreground">
            Join an active game or create your own room
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <JoinRoomDialog />
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-6 rounded-lg border border-yellow-500 bg-yellow-500/10 p-4 text-center">
          <p className="text-sm text-yellow-600 dark:text-yellow-500">
            Connecting to server...
          </p>
        </div>
      )}

      {/* Rooms List */}
      <PublicRoomsList />
    </div>
  )
}
