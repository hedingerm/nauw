import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { stripe, webhookSecret } from '@/src/lib/stripe/config'
import { SubscriptionService } from '@/src/lib/services/subscription.service'
import { BillingService } from '@/src/lib/services/billing.service'
import { createServiceRoleClient } from '@/src/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', {
      error: err,
      signature: signature,
      webhookSecret: webhookSecret ? 'Set' : 'Not set',
      webhookSecretLength: webhookSecret?.length,
      bodyLength: body.length
    })
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Initialize Supabase service role client for webhook operations
  const supabase = createServiceRoleClient()

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

      case 'invoice.created': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Received invoice.created event:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          status: invoice.status
        })
        // We'll handle this in invoice.finalized or invoice.payment_succeeded
        break
      }

      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Received invoice.finalized event:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          status: invoice.status
        })
        await handleInvoiceFinalized(invoice)
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
        // Unhandled event type
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
  const supabase = createServiceRoleClient()
  
  // Find business by Stripe customer ID
  let { data: business, error: businessError } = await supabase
    .from('Business')
    .select('id, stripe_customer_id')
    .eq('stripe_customer_id', subscription.customer)
    .maybeSingle() // Use maybeSingle instead of single to avoid errors when no rows found

  if (businessError) {
    console.error('Error querying business by stripe_customer_id:', {
      error: businessError,
      customerId: subscription.customer,
      errorCode: businessError.code,
      errorMessage: businessError.message
    })
  }

  if (!business) {
    // Try to find business by metadata if available
    const businessId = subscription.metadata?.business_id
    if (businessId) {
      const { data: businessByMeta, error: metaError } = await supabase
        .from('Business')
        .select('id, stripe_customer_id')
        .eq('id', businessId)
        .single()
      
      if (businessByMeta && !metaError) {
        // Update the business with the Stripe customer ID if not already set
        if (!businessByMeta.stripe_customer_id) {
          const { error: updateError } = await supabase
            .from('Business')
            .update({ 
              stripe_customer_id: subscription.customer as string,
              // Don't include updated_at - it's handled automatically by the database
            })
            .eq('id', businessByMeta.id)
          
          if (updateError) {
            console.error('Error updating business with stripe_customer_id:', updateError)
          }
        }
        
        business = businessByMeta
      } else {
        console.error('Could not find business by ID:', {
          businessId,
          error: metaError,
          errorCode: metaError?.code,
          errorMessage: metaError?.message
        })
        throw new Error(`Business not found with ID: ${businessId}`)
      }
    } else {
      console.error('No business_id in subscription metadata and no business found by customer ID')
      throw new Error('Cannot process subscription without business association')
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
    console.error('Plan not found:', {
      priceId,
      billingCycle,
      error: planError,
      errorCode: planError?.code,
      errorMessage: planError?.message
    })
    throw new Error(`Subscription plan not found for price ID: ${priceId}`)
  }

  // Check if subscription already exists
  const { data: existingSubscription } = await supabase
    .from('Subscription')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  // Stripe subscription objects may have current_period_start and current_period_end
  // but they might be undefined during certain webhook events
  const subscriptionWithPeriods = subscription as Stripe.Subscription & {
    current_period_start?: number
    current_period_end?: number
  }
  
  // Safe date handling with fallbacks
  let periodStart: Date
  let periodEnd: Date
  
  if (subscriptionWithPeriods.current_period_start) {
    periodStart = new Date(subscriptionWithPeriods.current_period_start * 1000)
  } else {
    console.warn('Subscription missing current_period_start, using current date', {
      subscriptionId: subscription.id,
      status: subscription.status
    })
    periodStart = new Date()
  }
  
  if (subscriptionWithPeriods.current_period_end) {
    periodEnd = new Date(subscriptionWithPeriods.current_period_end * 1000)
  } else {
    console.warn('Subscription missing current_period_end, calculating based on billing cycle', {
      subscriptionId: subscription.id,
      status: subscription.status,
      billingCycle
    })
    // Default to 30 days for monthly, 365 for annual
    const daysToAdd = billingCycle === 'annual' ? 365 : 30
    periodEnd = new Date(periodStart.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
  }
  
  // Validate period dates only if both were provided
  if (subscriptionWithPeriods.current_period_start && subscriptionWithPeriods.current_period_end) {
    if (periodEnd <= periodStart) {
      console.error('Invalid subscription period dates:', {
        subscriptionId: subscription.id,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        rawStart: subscriptionWithPeriods.current_period_start,
        rawEnd: subscriptionWithPeriods.current_period_end
      })
      throw new Error('Invalid subscription period: end date must be after start date')
    }
  }
  
  // Log subscription details for debugging
  console.log('Processing subscription update:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    businessId: business.id,
    planId: plan.id,
    billingCycle,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    status: subscription.status,
    hasPeriodDates: !!(subscriptionWithPeriods.current_period_start && subscriptionWithPeriods.current_period_end)
  })

  const subscriptionData = {
    business_id: business.id,
    plan_id: plan.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status: subscription.status,
    billing_cycle: billingCycle,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
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

    // No need to update business with subscription_id anymore
    // The subscription can be found by querying Subscription table with business_id
  }
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createServiceRoleClient()
  
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
  const supabase = createServiceRoleClient()
  
  console.log('Processing invoice.payment_succeeded:', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: invoice.amount_paid,
    hasPeriodDates: !!(invoice.period_start && invoice.period_end)
  })
  
  // Find business
  let { data: business, error: businessError } = await supabase
    .from('Business')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .maybeSingle()

  if (businessError) {
    console.error('Error finding business for invoice:', {
      error: businessError,
      customerId: invoice.customer,
      invoiceId: invoice.id
    })
    return
  }

  if (!business) {
    console.error('Business not found for invoice:', {
      customerId: invoice.customer,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number
    })
    
    // Try to find by subscription metadata if available
    const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string }
    if (invoiceWithSubscription.subscription && typeof invoiceWithSubscription.subscription === 'string') {
      const { data: subscription } = await supabase
        .from('Subscription')
        .select('business_id')
        .eq('stripe_subscription_id', invoiceWithSubscription.subscription)
        .single()
      
      if (!subscription) {
        console.error('Could not find business via subscription lookup')
        return
      }
      
      // Re-fetch business with the found ID
      const { data: businessById } = await supabase
        .from('Business')
        .select('id')
        .eq('id', subscription.business_id)
        .single()
      
      if (!businessById) {
        console.error('Business not found by ID from subscription')
        return
      }
      
      // Use the found business
      business = businessById
    } else {
      return
    }
  }

  // Safe period date handling
  let periodStart: string
  let periodEnd: string
  
  if (invoice.period_start) {
    periodStart = new Date(invoice.period_start * 1000).toISOString()
  } else {
    console.warn('Invoice missing period_start, using created date', {
      invoiceId: invoice.id
    })
    periodStart = new Date(invoice.created * 1000).toISOString()
  }
  
  if (invoice.period_end) {
    periodEnd = new Date(invoice.period_end * 1000).toISOString()
  } else {
    console.warn('Invoice missing period_end, calculating from period_start', {
      invoiceId: invoice.id
    })
    // Default to 30 days after period start
    const startDate = new Date(periodStart)
    periodEnd = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  // Create or update invoice record
  const invoiceData = {
    business_id: business.id,
    stripe_invoice_id: invoice.id,
    invoice_number: invoice.number || `INV-${Date.now()}`,
    status: 'paid',
    amount_total: (invoice.amount_paid / 100), // Convert from cents to CHF
    amount_paid: (invoice.amount_paid / 100),
    currency: invoice.currency.toUpperCase(),
    period_start: periodStart,
    period_end: periodEnd,
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
    .maybeSingle()

  if (existingInvoice) {
    const { error: updateError } = await supabase
      .from('Invoice')
      .update(invoiceData)
      .eq('id', existingInvoice.id)
    
    if (updateError) {
      console.error('Error updating invoice:', {
        error: updateError,
        invoiceId: invoice.id,
        businessId: business.id
      })
      throw updateError
    }
    
    console.log('Invoice updated successfully:', {
      invoiceId: existingInvoice.id,
      stripeInvoiceId: invoice.id,
      amount: invoiceData.amount_total
    })
  } else {
    const { data: newInvoice, error: insertError } = await supabase
      .from('Invoice')
      .insert(invoiceData)
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating invoice:', {
        error: insertError,
        invoiceId: invoice.id,
        businessId: business.id,
        invoiceData
      })
      throw insertError
    }
    
    console.log('Invoice created successfully:', {
      invoiceId: newInvoice.id,
      stripeInvoiceId: invoice.id,
      amount: invoiceData.amount_total
    })
  }

  // Update subscription period if this is a subscription invoice
  const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string }
  if (invoiceWithSubscription.subscription) {
    const { data: subscription } = await supabase
      .from('Subscription')
      .select('id')
      .eq('stripe_subscription_id', invoiceWithSubscription.subscription)
      .single()

    if (subscription) {
      const updateData: any = { status: 'active' }
      
      // Only update period dates if they exist
      if (invoice.period_start) {
        updateData.current_period_start = new Date(invoice.period_start * 1000).toISOString()
      }
      if (invoice.period_end) {
        updateData.current_period_end = new Date(invoice.period_end * 1000).toISOString()
      }
      
      await supabase
        .from('Subscription')
        .update(updateData)
        .eq('id', subscription.id)
    }
  }
}

// Handle invoice finalized (when invoice is ready but not yet paid)
async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  const supabase = createServiceRoleClient()
  
  console.log('Processing invoice.finalized:', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    status: invoice.status,
    amount: invoice.amount_due
  })
  
  // Find business (same logic as payment succeeded)
  let { data: business, error: businessError } = await supabase
    .from('Business')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .maybeSingle()

  if (businessError || !business) {
    console.error('Business not found for finalized invoice:', {
      error: businessError,
      customerId: invoice.customer,
      invoiceId: invoice.id
    })
    
    // Try subscription lookup
    const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string }
    if (invoiceWithSubscription.subscription && typeof invoiceWithSubscription.subscription === 'string') {
      const { data: subscription } = await supabase
        .from('Subscription')
        .select('business_id')
        .eq('stripe_subscription_id', invoiceWithSubscription.subscription)
        .single()
      
      if (!subscription) return
      
      const { data: businessById } = await supabase
        .from('Business')
        .select('id')
        .eq('id', subscription.business_id)
        .single()
      
      if (!businessById) return
      business = businessById
    } else {
      return
    }
  }

  // Safe period date handling
  let periodStart: string
  let periodEnd: string
  
  if (invoice.period_start) {
    periodStart = new Date(invoice.period_start * 1000).toISOString()
  } else {
    periodStart = new Date(invoice.created * 1000).toISOString()
  }
  
  if (invoice.period_end) {
    periodEnd = new Date(invoice.period_end * 1000).toISOString()
  } else {
    const startDate = new Date(periodStart)
    periodEnd = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  // Create invoice record with 'open' status
  const invoiceData = {
    business_id: business.id,
    stripe_invoice_id: invoice.id,
    invoice_number: invoice.number || `INV-${Date.now()}`,
    status: invoice.status === 'paid' ? 'paid' : 'open',
    amount_total: (invoice.amount_due / 100),
    amount_paid: invoice.status === 'paid' ? (invoice.amount_paid / 100) : 0,
    currency: invoice.currency.toUpperCase(),
    period_start: periodStart,
    period_end: periodEnd,
    due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
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
    .maybeSingle()

  if (!existingInvoice) {
    const { data: newInvoice, error: insertError } = await supabase
      .from('Invoice')
      .insert(invoiceData)
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating finalized invoice:', {
        error: insertError,
        invoiceId: invoice.id,
        businessId: business.id
      })
      throw insertError
    }
    
    console.log('Finalized invoice created successfully:', {
      invoiceId: newInvoice.id,
      stripeInvoiceId: invoice.id,
      status: invoiceData.status
    })
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = createServiceRoleClient()
  
  // Update subscription status to past_due
  const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string }
  if (invoiceWithSubscription.subscription) {
    await supabase
      .from('Subscription')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', invoiceWithSubscription.subscription)
  }

  // Find business and send notification
  const { data: business } = await supabase
    .from('Business')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .single()

  if (business) {
    const { NotificationService } = await import('@/src/lib/services/notification.service')
    await NotificationService.sendPaymentFailedNotification(
      business.id,
      (invoice.amount_due || 0) / 100 // Convert from cents to CHF
    )
  }

}

// Handle customer updates (payment method changes, etc)
async function handleCustomerUpdated(customer: Stripe.Customer) {
  // Currently no fields to update since we removed redundant fields
  // Keep this handler in case we need to track customer updates in the future
  // Log customer updates if needed in the future
}

// Handle completed checkout sessions
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServiceRoleClient()
  
  // If this is a booster pack purchase, add the credits
  if (session.metadata?.type === 'booster_pack' && session.metadata?.business_id) {
    const { UsageService } = await import('@/src/lib/services/usage.service')
    await UsageService.addBoosterPack(
      session.metadata.business_id,
      parseInt(session.metadata.amount || '50')
    )
    return
  }
  
  // For subscription mode, ensure the subscription is created
  // This handles cases where the subscription.created webhook might be delayed or missed
  if (session.mode === 'subscription' && session.subscription) {
    // Critical: First ensure the business has the Stripe customer ID before any other operations
    if (session.metadata?.business_id && session.customer) {
      
      // Check if business already has stripe_customer_id
      const { data: existingBusiness, error: checkError } = await supabase
        .from('Business')
        .select('id, stripe_customer_id')
        .eq('id', session.metadata.business_id)
        .single()
      
      if (checkError) {
        console.error('Error checking business:', checkError)
        throw new Error(`Failed to check business: ${checkError.message}`)
      }
      
      // Only update if not already set
      if (existingBusiness && !existingBusiness.stripe_customer_id) {
        const { error: updateError } = await supabase
          .from('Business')
          .update({ 
            stripe_customer_id: session.customer as string,
            // Don't include updated_at - it's handled automatically by the database
          })
          .eq('id', session.metadata.business_id)
        
        if (updateError) {
          console.error('Error updating business with stripe_customer_id:', updateError)
          throw new Error(`Failed to update business: ${updateError.message}`)
        }
        
      }
    }
    
    // Small delay to ensure database write is complete
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Retrieve the full subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    
    // Ensure subscription has business_id in metadata
    if (!subscription.metadata?.business_id && session.metadata?.business_id) {
      // Update the subscription metadata in Stripe
      await stripe.subscriptions.update(subscription.id, {
        metadata: {
          ...subscription.metadata,
          business_id: session.metadata.business_id
        }
      })
      
      // Update the local subscription object
      subscription.metadata = {
        ...subscription.metadata,
        business_id: session.metadata.business_id
      }
    }
    
    // Create/update the subscription in our database
    await handleSubscriptionUpdate(subscription)
    
    // Process the initial invoice to ensure it's recorded
    if (subscription.latest_invoice) {
      try {
        console.log('Processing initial invoice from checkout:', {
          subscriptionId: subscription.id,
          latestInvoice: subscription.latest_invoice
        })
        
        const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string)
        
        console.log('Retrieved initial invoice:', {
          invoiceId: invoice.id,
          status: invoice.status,
          amount: invoice.amount_paid
        })
        
        if (invoice.status === 'paid') {
          await handleInvoicePaymentSucceeded(invoice)
        } else if (invoice.status === 'open') {
          await handleInvoiceFinalized(invoice)
        }
      } catch (invoiceError) {
        console.error('Error processing initial invoice:', {
          error: invoiceError,
          subscriptionId: subscription.id,
          latestInvoice: subscription.latest_invoice
        })
        // Don't throw here as subscription is already created
      }
    } else {
      console.warn('No latest_invoice found on subscription:', {
        subscriptionId: subscription.id
      })
    }
  }
}