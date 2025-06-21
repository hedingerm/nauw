import { stripe } from '@/src/lib/stripe/config'
import Stripe from 'stripe'
import { SubscriptionService } from './subscription-service'

export interface CreateCheckoutSessionParams {
  businessId: string
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
  billingCycle?: 'monthly' | 'annual'
}

export interface CreatePortalSessionParams {
  customerId: string
  returnUrl: string
}

export class StripeService {
  // Create a Stripe customer for a business
  static async createCustomer(
    businessId: string,
    email: string,
    name: string
  ): Promise<Stripe.Customer> {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        business_id: businessId
      }
    })

    return customer
  }

  // Create a checkout session for subscription
  static async createCheckoutSession({
    businessId,
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    metadata = {},
    billingCycle = 'monthly'
  }: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    console.log('Creating checkout session with:', {
      businessId,
      customerId,
      priceId,
      billingCycle
    })
    
    // Add business ID to metadata
    const sessionMetadata = {
      ...metadata,
      business_id: businessId,
      billing_cycle: billingCycle
    }

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: sessionMetadata,
        subscription_data: {
          metadata: sessionMetadata
        },
        locale: 'de',
        payment_method_collection: 'if_required',
        customer_update: {
          address: 'auto'
        }
      })

      return session
    } catch (error) {
      console.error('Stripe checkout session error:', error)
      if (error instanceof Stripe.errors.StripeError) {
        throw new Error(`Stripe error: ${error.message}`)
      }
      throw error
    }
  }

  // Create a checkout session for booster pack
  static async createBoosterPackSession(
    businessId: string,
    customerId: string,
    successUrl: string,
    cancelUrl: string,
    amount: number = 50
  ): Promise<Stripe.Checkout.Session> {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'chf',
          product_data: {
            name: `Booster Pack - ${amount} zusätzliche Buchungen`,
            description: `${amount} zusätzliche Buchungen für Ihr Kontingent`
          },
          unit_amount: 2000 // 20 CHF in cents
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'booster_pack',
        business_id: businessId,
        amount: amount.toString()
      },
      locale: 'de'
    })

    return session
  }

  // Create a billing portal session
  static async createPortalSession({
    customerId,
    returnUrl
  }: CreatePortalSessionParams): Promise<Stripe.BillingPortal.Session> {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      locale: 'de'
    })

    return session
  }

  // Update subscription (upgrade/downgrade)
  static async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription> {
    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    // Update to new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId
      }],
      proration_behavior: 'create_prorations'
    })

    return updatedSubscription
  }

  // Cancel subscription at period end
  static async cancelSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })

    return subscription
  }

  // Reactivate canceled subscription
  static async reactivateSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    })

    return subscription
  }

  // Get subscription details
  static async getSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  }

  // Get upcoming invoice (preview of next invoice)
  static async getUpcomingInvoice(
    customerId: string
  ): Promise<Stripe.Invoice | null> {
    try {
      const invoice = await (stripe.invoices as any).retrieveUpcoming({
        customer: customerId
      })
      return invoice
    } catch (error) {
      // No upcoming invoice
      return null
    }
  }

  // Create usage record for metered billing (overage charges)
  static async reportUsageRecord(
    subscriptionItemId: string,
    quantity: number,
    timestamp: number = Math.floor(Date.now() / 1000)
  ): Promise<any> {
    const usageRecord = await (stripe.subscriptionItems as any).createUsageRecord(
      subscriptionItemId,
      {
        quantity,
        timestamp,
        action: 'increment'
      }
    )

    return usageRecord
  }

  // Get customer's payment methods
  static async getPaymentMethods(
    customerId: string
  ): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    })

    return paymentMethods.data
  }

  // Set default payment method
  static async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.Customer> {
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    return customer
  }
}