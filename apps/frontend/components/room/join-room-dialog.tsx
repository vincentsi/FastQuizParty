'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRoom } from '@/lib/hooks/useRoom'
import { useSocket } from '@/lib/socket/socket-context'
import { LogIn } from 'lucide-react'

interface JoinRoomDialogProps {
  trigger?: React.ReactNode
}

export function JoinRoomDialog({ trigger }: JoinRoomDialogProps) {
  const router = useRouter()
  const { isConnected } = useSocket()
  const { joinRoom, isLoading, error } = useRoom()

  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleJoin = async () => {
    if (!isConnected) {
      alert('Not connected to server')
      return
    }

    if (!code || code.length !== 6) {
      alert('Please enter a valid 6-digit room code')
      return
    }

    const result = await joinRoom({
      code,
      password: password || undefined,
      username: username || undefined,
    })

    if (result) {
      setOpen(false)
      router.push(`/room/${result.room.id}`)
    } else if (error?.includes('password')) {
      setShowPassword(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <LogIn className="mr-2 h-4 w-4" />
            Join Room
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Game Room</DialogTitle>
          <DialogDescription>
            Enter the 6-digit room code to join a game.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Room Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Room Code</Label>
            <Input
              id="code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </div>

          {/* Username (optional for guests) */}
          <div className="space-y-2">
            <Label htmlFor="username">Username (optional)</Label>
            <Input
              id="username"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use your account name
            </p>
          </div>

          {/* Password (if needed) */}
          {showPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Room Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={isLoading || !isConnected || !code}>
            {isLoading ? 'Joining...' : 'Join Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
