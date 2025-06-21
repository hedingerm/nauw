import Stripe from 'stripe'

// Initialize Stripe with TypeScript
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

// Stripe webhook secret for verifying webhooks
export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Stripe public key for client-side
export const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

// Subscription status mapping
export const SUBSCRIPTION_STATUS_MAP = {
  active: 'active',
  past_due: 'past_due',
  canceled: 'canceled',
  incomplete: 'incomplete',
  incomplete_expired: 'incomplete_expired',
  trialing: 'trialing',
  paused: 'paused',
} as const

// Invoice status mapping
export const INVOICE_STATUS_MAP = {
  draft: 'draft',
  open: 'open',
  paid: 'paid',
  void: 'void',
  uncollectible: 'uncollectible',
} as const