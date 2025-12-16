'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth.provider'
import { apiClient } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ShieldCheck, Calendar, Mail, UserRound } from 'lucide-react'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address'),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || '',
      email: user?.email || '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await apiClient.patch('/api/auth/profile', data)

      // Invalider le cache pour forcer un refetch des données utilisateur
      await queryClient.invalidateQueries({ queryKey: ['me'] })

      setUpdateSuccess(true)
      setIsEditing(false)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (error: unknown) {
      const errorData = (error as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data
      const errorMessage = errorData?.error || errorData?.message || 'Failed to update profile'

      form.setError('root', {
        message: errorMessage,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">Not authenticated</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-6 py-8 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
              <ShieldCheck className="h-4 w-4" />
              Secure profile
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your profile, your workspace</h1>
            <p className="max-w-2xl text-white/80">
              Keep your account details up to date. We use your profile to personalize analytics and billing.
            </p>
          </div>
          {user.planType && (
            <Badge variant="secondary" className="bg-white text-indigo-600 hover:bg-white/90">
              Plan: {user.planType}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {updateSuccess && (
              <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Profile updated successfully
              </div>
            )}

            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {form.formState.errors.root && (
                    <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                      {form.formState.errors.root.message}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your name" />
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
                            <Input type="email" {...field} placeholder="your@email.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  <div className="flex gap-2">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        form.reset()
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <dl className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <dd className="mt-2 text-sm">{user.email}</dd>
                </div>

                <div className="rounded-xl border bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <UserRound className="h-4 w-4" />
                    Name
                  </div>
                  <dd className="mt-2 text-sm">{user.name || 'Not set'}</dd>
                </div>

                <div className="rounded-xl border bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    User ID
                  </div>
                  <dd className="mt-2 font-mono text-xs text-muted-foreground">{user.id}</dd>
                </div>

                <div className="rounded-xl border bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </div>
                  <dd className="mt-2 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Account health</CardTitle>
            <CardDescription>Quick signals to keep you on track</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-semibold text-green-700">Security</p>
              <p className="text-sm text-muted-foreground">2FA recommended for admins</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-semibold text-indigo-700">Usage</p>
              <p className="text-sm text-muted-foreground">You’re on {user.planType || 'FREE'} — upgrade for realtime rooms</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-semibold text-amber-700">Billing</p>
              <p className="text-sm text-muted-foreground">Invoices are available in the billing center</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
