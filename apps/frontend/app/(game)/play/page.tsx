'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JoinRoomDialog } from '@/components/room'
import { Users, Gamepad2, Trophy, Sparkles } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function PlayPage() {
  return (
    <div className="container mx-auto py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold">Ready to Play?</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Choose how you want to play FastQuizParty
        </p>
      </div>

      {/* Play Options */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Join a Room */}
        <Card className="border-2 hover:border-primary transition-colors">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">Join a Room</CardTitle>
            <CardDescription>
              Have a room code? Join an existing game with friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinRoomDialog
              trigger={
                <Button className="w-full" size="lg">
                  Join with Code
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Browse Public Rooms */}
        <Card className="border-2 hover:border-primary transition-colors">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Gamepad2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">Public Rooms</CardTitle>
            <CardDescription>
              Browse and join public game rooms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" variant="outline" asChild>
              <Link href="/rooms">
                Browse Rooms
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Browse Quizzes */}
        <Card className="border-2 hover:border-primary transition-colors">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">Browse Quizzes</CardTitle>
            <CardDescription>
              Explore quizzes and create your own room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" variant="outline" asChild>
              <Link href="/quizzes">
                View Quizzes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="mt-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Why Play FastQuizParty?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Trophy className="h-8 w-8 text-primary" />
              <CardTitle className="mt-2">Competitive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Compete with friends and players worldwide. Climb the leaderboard!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Gamepad2 className="h-8 w-8 text-primary" />
              <CardTitle className="mt-2">Real-time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Experience instant feedback and live scoring in multiplayer games
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary" />
              <CardTitle className="mt-2">Diverse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Hundreds of quizzes across multiple categories and difficulty levels
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
