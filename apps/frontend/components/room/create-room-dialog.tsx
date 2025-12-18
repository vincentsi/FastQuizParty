'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { quizApi } from '@/lib/api/quiz'
import { useRoom } from '@/lib/hooks/useRoom'
import { useSocket } from '@/lib/socket/socket-context'
import type { RoomCreateDto } from '@/types/room'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CreateRoomDialogProps {
  quizId?: string
  trigger?: React.ReactNode
}

export function CreateRoomDialog({ quizId, trigger }: CreateRoomDialogProps) {
  const router = useRouter()
  const { isConnected } = useSocket()
  const { createRoom, isLoading, error } = useRoom()

  const [open, setOpen] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizId || '')
  const [maxPlayers, setMaxPlayers] = useState([10])
  const [questionTime, setQuestionTime] = useState([15])
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')

  // Fetch quizzes for selection (only if quizId not provided)
  const { data: quizzesData, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ['quizzes', { isPublic: true, limit: 50 }],
    queryFn: () => quizApi.getQuizzes({ isPublic: true, limit: 50 }),
    enabled: open && !quizId, // Only fetch when dialog is open and no quizId provided
  })

  const handleCreate = async () => {
    if (!isConnected) {
      alert('Not connected to server')
      return
    }

    const finalQuizId = quizId || selectedQuizId
    if (!finalQuizId) {
      alert('Please select a quiz')
      return
    }

    const data: RoomCreateDto = {
      quizId: finalQuizId,
      maxPlayers: maxPlayers[0],
      questionTime: questionTime[0],
      isPrivate,
      password: isPrivate && password ? password : undefined,
    }

    const room = await createRoom(data)

    if (room) {
      setOpen(false)
      // Find host player
      const hostPlayer = room.players.find(p => p.isHost)
      if (hostPlayer) {
        // Store room state in sessionStorage for the new room
        sessionStorage.setItem('currentRoomId', room.id)
        sessionStorage.setItem('currentPlayerId', hostPlayer.id)
        sessionStorage.setItem(
          `room:${room.id}`,
          JSON.stringify({ room, playerId: hostPlayer.id })
        )
      }
      // Clear any old room data to avoid conflicts
      const oldRoomId = sessionStorage.getItem('currentRoomId')
      if (oldRoomId && oldRoomId !== room.id) {
        sessionStorage.removeItem(`room:${oldRoomId}`)
      }
      router.push(`/room/${room.id}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Room
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Game Room</DialogTitle>
          <DialogDescription>
            {quizId
              ? 'Configure your game room settings. Players can join using the room code.'
              : 'Select a quiz and configure your game room settings. Players can join using the room code.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Quiz Selection (only if quizId not provided) */}
          {!quizId && (
            <div className="space-y-2">
              <Label htmlFor="quiz">Select Quiz *</Label>
              <Select
                value={selectedQuizId}
                onValueChange={setSelectedQuizId}
                disabled={isLoadingQuizzes}
              >
                <SelectTrigger id="quiz">
                  <SelectValue
                    placeholder={
                      isLoadingQuizzes ? 'Loading quizzes...' : 'Choose a quiz'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {quizzesData?.quizzes.map(quiz => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title} {quiz.difficulty && `(${quiz.difficulty})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {quizzesData?.quizzes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No quizzes available.{' '}
                  <a href="/quizzes" className="text-primary underline">
                    Browse quizzes
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Max Players */}
          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Max Players: {maxPlayers[0]}</Label>
            <Slider
              id="maxPlayers"
              min={2}
              max={50}
              step={1}
              value={maxPlayers}
              onValueChange={setMaxPlayers}
              className="w-full"
            />
          </div>

          {/* Question Time */}
          <div className="space-y-2">
            <Label htmlFor="questionTime">
              Question Time: {questionTime[0]}s
            </Label>
            <Slider
              id="questionTime"
              min={5}
              max={60}
              step={5}
              value={questionTime}
              onValueChange={setQuestionTime}
              className="w-full"
            />
          </div>

          {/* Private Room */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isPrivate" className="cursor-pointer">
              Private Room
            </Label>
            <Switch
              id="isPrivate"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>

          {/* Password (if private) */}
          {isPrivate && (
            <div className="space-y-2">
              <Label htmlFor="password">Room Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={4}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">4-20 characters</p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              isLoading ||
              !isConnected ||
              (!quizId && !selectedQuizId) ||
              isLoadingQuizzes
            }
          >
            {isLoading ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
