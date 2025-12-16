'use client'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-slate-900 dark:text-white">
      <header className="border-b bg-white/90 dark:bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-slate-900 dark:text-white"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              FQ
            </span>
            <span className="text-lg">FastQuizParty</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 dark:text-gray-300 md:flex">
            <Link href="/quizzes" className="hover:text-primary">
              Quizzes
            </Link>
            <Link href="/rooms" className="hover:text-primary">
              Rooms
            </Link>
            <Link href="/play" className="hover:text-primary">
              Play
            </Link>
            <Link href="/pricing" className="hover:text-primary">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild className="text-slate-800 dark:text-gray-200 hover:text-primary">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-12">
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-800 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-800 px-6 py-12 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.35),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(236,72,153,0.35),transparent_30%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                <Sparkles className="h-4 w-4" />
                Realtime quiz platform
              </div>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Host, play, and share quizzes that feel instant
              </h1>
              <p className="max-w-2xl text-lg text-white/80">
                Crée des rooms en quelques secondes, partage le code, et laisse
                la magie opérer. Scoreboards en direct, timers fiables et une UI
                pensée pour les animateurs.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild className="gap-2">
                  <Link href="/register">
                    Démarrer gratuitement
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-white/30 bg-transparent text-white hover:bg-white/20 hover:text-white"
                >
                  <Link href="/quizzes">Explorer les quizzes</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-200" />
                  Auth sécurisée & cookies httpOnly
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1">
                  <Timer className="h-4 w-4 text-amber-200" />
                  Timers précis & anti-triche côté serveur
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1">
                  <Users className="h-4 w-4 text-sky-200" />
                  Jouez en équipe ou en solo
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between text-sm text-white/70">
                <span>Live room preview</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                  <Zap className="h-3 w-3" />
                  Realtime
                </span>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-white/10 p-4">
                  <div className="flex items-center justify-between text-sm text-white">
                    <div className="font-semibold">Room #8H3JQK</div>
                    <div className="text-xs text-white/70">15 players</div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/80">
                    <div className="rounded-lg bg-white/5 p-3">Timer: 12s</div>
                    <div className="rounded-lg bg-white/5 p-3">
                      Question 4/10
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      Streaks active
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <div className="flex items-center justify-between text-sm text-white">
                    <div className="font-semibold">Live leaderboard</div>
                    <span className="text-xs text-white/70">Top 3</span>
                  </div>
                  <div className="mt-3 space-y-2 text-white">
                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span>Marie</span>
                      <span className="font-semibold">12 450 pts</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span>Alex</span>
                      <span className="font-semibold">11 980 pts</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span>Sam</span>
                      <span className="font-semibold">10 340 pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Création instantanée',
              desc: 'Choisis un quiz, partage le code room, lance le compte à rebours. Rien à installer.',
            },
            {
              title: 'Confiance & sécurité',
              desc: 'CSRF, rate limit, JWT courts, cookies httpOnly, validation Zod sur toutes les requêtes.',
            },
            {
              title: 'Pensé pour les équipes',
              desc: 'UI claire pour les animateurs, leaderboard en temps réel, timers fiables pour éviter les contestations.',
            },
          ].map(item => (
            <div
              key={item.title}
              className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
