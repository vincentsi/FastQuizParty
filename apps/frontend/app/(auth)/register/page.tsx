'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useAuth } from '@/providers/auth.provider'
import { registerSchema, type RegisterFormData } from '@/lib/validators/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Sparkles, Users, Zap } from 'lucide-react'

export default function RegisterPage() {
  const { register: registerUser } = useAuth()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data)
    } catch (error: unknown) {
      // Extract error message from API response
      // Backend returns { success: false, error: "message" }
      const errorData = (error as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data
      const errorMessage = errorData?.error || errorData?.message || 'Registration failed'

      form.setError('root', {
        message: errorMessage,
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 lg:grid-cols-2">
        <Card className="overflow-hidden border-none bg-gradient-to-br from-indigo-700 via-purple-600 to-fuchsia-600 text-white shadow-2xl">
          <CardContent className="space-y-6 p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
              <Sparkles className="h-4 w-4" />
              Build faster
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight">Crée ton compte en moins d’une minute</h1>
              <p className="text-white/80">
                L’expérience de quiz temps réel pensée pour les équipes produit, profs et animateurs.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Users className="h-4 w-4" />
                  Collaboration
                </div>
                <p className="mt-1 text-sm text-white/70">Invitations simples, gestion des rôles, rooms privées.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Zap className="h-4 w-4" />
                  Realtime
                </div>
                <p className="mt-1 text-sm text-white/70">Scoreboard instantané et timers fiables.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-xl justify-self-center shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Sign up</CardTitle>
            <CardDescription>Create your account</CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {form.formState.errors.root && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {form.formState.errors.root.message}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Creating account...' : 'Sign up'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
