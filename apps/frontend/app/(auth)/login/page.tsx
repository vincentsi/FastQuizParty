'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useAuth } from '@/providers/auth.provider'
import { loginSchema, type LoginFormData } from '@/lib/validators/auth'
import { useFormSubmit } from '@/lib/hooks/use-form-submit'
import { ERROR_MESSAGES } from '@/lib/constants/errors'
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
import { Sparkles, ShieldCheck, Clock } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const { handleSubmit: handleFormSubmit } = useFormSubmit({
    onSubmit: login,
    setError: form.setError,
    defaultErrorMessage: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
  })

  // Wrapper to use with React Hook Form
  const onSubmit = (data: LoginFormData) => handleFormSubmit(data)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 lg:grid-cols-2">
        <Card className="overflow-hidden border-none bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-800 text-white shadow-2xl">
          <CardContent className="space-y-6 p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
              <Sparkles className="h-4 w-4" />
              FastQuizParty
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight">Rejoignez vos rooms en un clic</h1>
              <p className="text-white/80">
                Un espace clair pour lancer vos quiz, suivre les scores et gérer vos équipes sans friction.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck className="h-4 w-4" />
                  SSO & sécurité
                </div>
                <p className="mt-1 text-sm text-white/70">Auth sécurisée, tokens courts, cookies httpOnly.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Clock className="h-4 w-4" />
                  Gain de temps
                </div>
                <p className="mt-1 text-sm text-white/70">Rejoignez en moins de 15s et lancez votre partie.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-xl justify-self-center shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>Accédez à votre espace</CardDescription>
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

                <div className="flex items-center justify-between">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary"
                    prefetch
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline" prefetch>
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
