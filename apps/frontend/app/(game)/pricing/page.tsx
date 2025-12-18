'use client'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { STRIPE_PRICES } from '@/lib/stripe/config'
import { useAuth } from '@/providers/auth.provider'
import { Check, Rocket, Shield, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load heavy components (reduces initial bundle)
const StripeCheckout = dynamic(
  () =>
    import('@/components/pricing/stripe-checkout').then(mod => ({
      default: mod.StripeCheckout,
    })),
  {
    loading: () => <Skeleton className="h-10 w-full" />,
    ssr: false,
  }
)

const PLANS = [
  {
    name: 'FREE',
    price: '$0',
    description: 'Launch your first quizzes in minutes.',
    features: [
      'Unlimited public quizzes',
      'Community support',
      '1 team seat',
      'Basic analytics',
    ],
    priceId: null, // No Stripe price ID for free plan
  },
  {
    name: 'PRO',
    price: '$15',
    period: '/month',
    description: 'For product folks and small squads that ship often.',
    features: [
      'Everything in Free',
      'Realtime leaderboards',
      'Priority support (24h SLA)',
      '5 seats included',
      'Unlimited private rooms',
      'API access + webhooks',
    ],
    priceId: STRIPE_PRICES.PRO || null, // Configure via NEXT_PUBLIC_STRIPE_PRICE_PRO env var
    highlighted: true,
  },
  {
    name: 'BUSINESS',
    price: '$50',
    period: '/month',
    description: 'For scale-ups with security and support needs.',
    features: [
      'Everything in Pro',
      'Dedicated CSM',
      'Unlimited seats',
      'SAML/SSO & SCIM',
      'Advanced security & audit',
      '99.9% uptime SLA',
    ],
    priceId: STRIPE_PRICES.BUSINESS || null, // Configure via NEXT_PUBLIC_STRIPE_PRICE_BUSINESS env var
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const currentPlan = user?.planType || 'FREE'

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-10 text-center text-white shadow-xl">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.35),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.3),transparent_30%)]" />
        <div className="relative flex flex-col items-center gap-4">
          <Badge
            variant="secondary"
            className="bg-white/10 text-white border-white/20"
          >
            New in v1.0 — realtime rooms & leaderboards
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Choose the plan built for shipping fast
          </h1>
          <p className="max-w-2xl text-base text-white/70">
            Simple pricing for teams that need reliable quizzes, realtime rooms,
            and a clean admin experience.
          </p>
          {user && currentPlan && (
            <p className="text-sm text-white/60">
              Your current plan:{' '}
              <span className="font-semibold text-white">{currentPlan}</span>
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
              <Sparkles className="h-4 w-4 text-amber-300" />
              14-day money-back guarantee
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
              <Shield className="h-4 w-4 text-emerald-300" />
              Secure payments by Stripe
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
              <Rocket className="h-4 w-4 text-sky-300" />
              Cancel anytime
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map(plan => {
          const isCurrentPlan = !!(user && currentPlan === plan.name)

          return (
            <Card
              key={plan.name}
              className={`relative h-full overflow-hidden transition hover:-translate-y-1 hover:shadow-lg ${
                plan.highlighted
                  ? 'border-primary shadow-xl ring-1 ring-primary/20'
                  : ''
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle
                      className="text-2xl"
                      data-testid={`plan-${plan.name.toLowerCase()}`}
                    >
                      {plan.name}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  {isCurrentPlan && (
                    <Badge variant="outline" className="text-xs">
                      Current plan
                    </Badge>
                  )}
                </div>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground mb-1">
                      {plan.period}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                  <StripeCheckout
                    priceId={plan.priceId}
                    planName={plan.name}
                    isCurrentPlan={isCurrentPlan}
                    variant={plan.highlighted ? 'default' : 'outline'}
                  />
                </Suspense>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include 14-day money-back guarantee</p>
        <p className="mt-1">Questions? Contact support@example.com</p>
      </div>
    </div>
  )
}
