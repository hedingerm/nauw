import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { stripe, webhookSecret } from '@/src/lib/stripe/config'
import { SubscriptionService } from '@/src/lib/services/subscription-service'
import { BillingService } from '@/src/lib/services/billing-service'
import { createAdminClient } from '@/src/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Initialize Supabase admin client with service role for admin operations
  const supabase = await createAdminClient()

  console.log('Webhook received:', {
    type: event.type,
    id: event.id,
    created: new Date(event.created * 1000).toISOString()
  })

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        try {
          await handleSubscriptionUpdate(subscription)
        } catch (error) {
          console.error('Error handling subscription update:', error)
          throw error
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer
        await handleCustomerUpdated(customer)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        try {
          await handleCheckoutCompleted(session)
        } catch (error) {
          console.error('Error handling checkout completed:', error)
          throw error
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Handle subscription create/update
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const supabase = await createAdminClient()
  
  // Find business by Stripe customer ID
  let { data: business, error: businessError } = await supabase
    .from('Business')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .single()

  if (businessError || !business) {
    console.error('Business not found for customer:', subscription.customer)
    
    // Try to find business by metadata if available
    const businessId = subscription.metadata?.business_id
    if (businessId) {
      console.log('Attempting to find business by metadata ID:', businessId)
      const { data: businessByMeta, error: metaError } = await supabase
        .from('Business')
        .select('id')
        .eq('id', businessId)
        .single()
      
      if (businessByMeta && !metaError) {
        // Update the business with the Stripe customer ID
        console.log('Updating business with Stripe customer ID')
        await supabase
          .from('Business')
          .update({ stripe_customer_id: subscription.customer as string })
          .eq('id', businessByMeta.id)
        
        business = businessByMeta
      } else {
        console.error('Could not find business by ID:', businessId, metaError)
        return
      }
    } else {
      console.error('No business_id in subscription metadata')
      return
    }
  }

  // Get the price ID to find the plan
  const priceId = subscription.items.data[0]?.price.id
  const billingCycle = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly'
  
  // Find the subscription plan by price ID
  const { data: plan, error: planError } = await supabase
    .from('SubscriptionPlan')
    .select('id')
    .eq(billingCycle === 'annual' ? 'stripe_price_annual_id' : 'stripe_price_monthly_id', priceId)
    .single()

  if (planError || !plan) {
    console.error('Plan not found for price:', priceId)
    return
  }

  // Check if subscription already exists
  const { data: existingSubscription } = await supabase
    .from('Subscription')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  const subscriptionData = {
    business_id: business.id,
    plan_id: plan.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status: subscription.status,
    billing_cycle: billingCycle,
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    metadata: subscription.metadata || {}
  }

  if (existingSubscription) {
    // Update existing subscription
    const { error: updateError } = await supabase
      .from('Subscription')
      .update(subscriptionData)
      .eq('id', existingSubscription.id)
    
    if (updateError) {
      console.error('Error updating subscription:', updateError)
      throw updateError
    }
  } else {
    // Create new subscription
    const { data: newSubscription, error: insertError } = await supabase
      .from('Subscription')
      .insert(subscriptionData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating subscription:', insertError)
      throw insertError
    }

    if (newSubscription) {
      // Update business with subscription ID
      const { error: businessUpdateError } = await supabase
        .from('Business')
        .update({ subscription_id: newSubscription.id })
        .eq('id', business.id)
      
      if (businessUpdateError) {
        console.error('Error updating business with subscription ID:', businessUpdateError)
        throw businessUpdateError
      }
    }
  }
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = await createAdminClient()
  
  await supabase
    .from('Subscription')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
}

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabase = await createAdminClient()
  
  // Find business
  const { data: business } = await supabase
    .from('Business')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .single()

  if (!business) return

  // Create or update invoice record
  const invoiceData = {
    business_id: business.id,
    stripe_invoice_id: invoice.id,
    invoice_number: invoice.number || `INV-${Date.now()}`,
    status: 'paid',
    amount_total: (invoice.amount_paid / 100), // Convert from cents to CHF
    amount_paid: (invoice.amount_paid / 100),
    currency: invoice.currency.toUpperCase(),
    period_start: new Date(invoice.period_start * 1000).toISOString(),
    period_end: new Date(invoice.period_end * 1000).toISOString(),
    paid_at: new Date().toISOString(),
    payment_method_type: (invoice as any).payment_intent ? 'card' : 'other',
    line_items: invoice.lines.data.map((line: any) => ({
      description: line.description || '',
      quantity: line.quantity || 1,
      unit_price: line.unit_amount ? line.unit_amount / 100 : 0,
      amount: line.amount / 100
    })),
    metadata: invoice.metadata || {}
  }

  // Check if invoice exists
  const { data: existingInvoice } = await supabase
    .from('Invoice')
    .select('id')
    .eq('stripe_invoice_id', invoice.id)
    .single()

  if (existingInvoice) {
    await supabase
      .from('Invoice')
      .update(invoiceData)
      .eq('id', existingInvoice.id)
  } else {
    await supabase
      .from('Invoice')
      .insert(invoiceData)
  }

  // Update subscription period if this is a subscription invoice
  if ((invoice as any).subscription) {
    const { data: subscription } = await supabase
      .from('Subscription')
      .select('id')
      .eq('stripe_subscription_id', (invoice as any).subscription)
      .single()

    if (subscription) {
      await supabase
        .from('Subscription')
        .update({
          current_period_start: new Date(invoice.period_start * 1000).toISOString(),
          current_period_end: new Date(invoice.period_end * 1000).toISOString(),
          status: 'active'
        })
        .eq('id', subscription.id)
    }
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = await createAdminClient()
  
  // Update subscription status to past_due
  if ((invoice as any).subscription) {
    await supabase
      .from('Subscription')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', (invoice as any).subscription)
  }

  // Find business and send notification
  const { data: business } = await supabase
    .from('Business')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .single()

  if (business) {
    const { NotificationService } = await import('@/src/lib/services/notification-service')
    await NotificationService.sendPaymentFailedNotification(
      business.id,
      (invoice.amount_due || 0) / 100 // Convert from cents to CHF
    )
  }

  console.log('Payment failed for invoice:', invoice.id)
}

// Handle customer updates (payment method changes, etc)
async function handleCustomerUpdated(customer: Stripe.Customer) {
  const supabase = await createAdminClient()
  
  // Update payment method info if available
  const paymentMethod = customer.invoice_settings?.default_payment_method
  let last4, brand
  
  if (paymentMethod && typeof paymentMethod === 'object' && 'card' in paymentMethod) {
    last4 = paymentMethod.card?.last4
    brand = paymentMethod.card?.brand
  }

  await supabase
    .from('Business')
    .update({
      billing_email: customer.email,
      payment_method_last4: last4,
      payment_method_brand: brand
    })
    .eq('stripe_customer_id', customer.id)
}

// Handle completed checkout sessions
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', {
    sessionId: session.id,
    mode: session.mode,
    metadata: session.metadata,
    customerId: session.customer,
    subscriptionId: session.subscription
  })
  
  // If this is a booster pack purchase, add the credits
  if (session.metadata?.type === 'booster_pack' && session.metadata?.business_id) {
    const { UsageService } = await import('@/src/lib/services/usage-service')
    await UsageService.addBoosterPack(
      session.metadata.business_id,
      parseInt(session.metadata.amount || '50')
    )
    return
  }
  
  // For subscription mode, ensure the subscription is created
  // This handles cases where the subscription.created webhook might be delayed or missed
  if (session.mode === 'subscription' && session.subscription) {
    const supabase = await createAdminClient()
    
    // First, ensure the business has the Stripe customer ID
    if (session.metadata?.business_id && session.customer) {
      console.log('Updating business with Stripe customer ID from checkout session')
      await supabase
        .from('Business')
        .update({ stripe_customer_id: session.customer as string })
        .eq('id', session.metadata.business_id)
    }
    
    // Retrieve the full subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    
    console.log('Retrieved subscription details:', {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer,
      priceId: subscription.items.data[0]?.price.id,
      metadata: subscription.metadata
    })
    
    // Create/update the subscription in our database
    await handleSubscriptionUpdate(subscription)
    
    // Optionally trigger an immediate invoice payment succeeded event
    // to ensure the first invoice is recorded
    if (subscription.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string)
      if (invoice.status === 'paid') {
        await handleInvoicePaymentSucceeded(invoice)
      }
    }
  }
}