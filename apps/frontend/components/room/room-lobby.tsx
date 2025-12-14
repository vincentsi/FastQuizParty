'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Room, Player } from '@/types/room'
import { Users, Clock, Play, LogOut, Check, X, Wifi, WifiOff } from 'lucide-react'

interface RoomLobbyProps {
  room: Room
  currentPlayer: Player
  onReady: () => void
  onStart: () => void
  onLeave: () => void
  isLoading?: boolean
}

export function RoomLobby({
  room,
  currentPlayer,
  onReady,
  onStart,
  onLeave,
  isLoading = false,
}: RoomLobbyProps) {
  const isHost = currentPlayer.isHost
  const allReady = room.players.every((p) => p.isReady || p.isHost)
  const canStart = isHost && allReady && room.players.length >= 2

  return (
    <div className="container mx-auto max-w-4xl py-8">
      {/* Room Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Room Code: {room.code}</CardTitle>
              <CardDescription>
                Share this code with your friends to join
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onLeave} disabled={isLoading}>
              <LogOut className="mr-2 h-4 w-4" />
              Leave
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Players</div>
                <div className="text-muted-foreground">
                  {room.players.length} / {room.maxPlayers}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Question Time</div>
                <div className="text-muted-foreground">{room.questionTime}s</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {room.isPrivate ? (
                <Badge variant="outline">Private</Badge>
              ) : (
                <Badge variant="secondary">Public</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {room.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  {player.isConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">
                      {player.username}
                      {player.id === currentPlayer.id && (
                        <span className="ml-2 text-sm text-muted-foreground">(You)</span>
                      )}
                    </div>
                    <div className="flex gap-2 text-sm">
                      {player.isHost && (
                        <Badge variant="default" className="text-xs">
                          Host
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {player.isReady || player.isHost ? (
                    <Badge variant="default" className="bg-green-500">
                      <Check className="mr-1 h-3 w-3" />
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <X className="mr-1 h-3 w-3" />
                      Not Ready
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          {!isHost && (
            <Button
              onClick={onReady}
              disabled={isLoading}
              variant={currentPlayer.isReady ? 'outline' : 'default'}
              className="w-full"
            >
              {currentPlayer.isReady ? 'Not Ready' : 'Ready'}
            </Button>
          )}

          {isHost && (
            <div className="flex w-full flex-col gap-2">
              {!allReady && (
                <p className="text-center text-sm text-muted-foreground">
                  Waiting for all players to be ready...
                </p>
              )}
              <Button
                onClick={onStart}
                disabled={!canStart || isLoading}
                className="w-full"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Game
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Game Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Game Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Question Time:</span>
              <span className="font-medium">{room.questionTime} seconds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Players:</span>
              <span className="font-medium">{room.maxPlayers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room Type:</span>
              <span className="font-medium">
                {room.isPrivate ? 'Private' : 'Public'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
