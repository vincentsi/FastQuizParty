'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRoom } from '@/lib/hooks/useRoom'
import { Users, Clock, Play } from 'lucide-react'
import type { RoomListItem } from '@/types/room'

export function PublicRoomsList() {
  const router = useRouter()
  const { publicRooms, fetchPublicRooms, joinRoom, isLoading } = useRoom()

  useEffect(() => {
    fetchPublicRooms()
  }, [fetchPublicRooms])

  const handleJoinRoom = async (room: RoomListItem) => {
    const result = await joinRoom({ code: room.code })
    if (result) {
      router.push(`/room/${result.room.id}`)
    }
  }

  if (publicRooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No public rooms available</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create a room to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {publicRooms.map((room) => (
        <Card key={room.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{room.quizTitle}</CardTitle>
                <CardDescription>
                  Host: {room.hostUsername}
                </CardDescription>
              </div>
              <Badge variant="secondary">{room.code}</Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {room.playerCount}/{room.maxPlayers}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{Math.ceil((room.playerCount * 15) / 60)} min</span>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={() => handleJoinRoom(room)}
              disabled={isLoading || room.playerCount >= room.maxPlayers}
              className="w-full"
            >
              {room.playerCount >= room.maxPlayers ? (
                'Full'
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Join
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
