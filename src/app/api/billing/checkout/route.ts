import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/src/lib/supabase/route-handler"
import { StripeService } from "@/src/lib/services/stripe.service"

export async function POST(request: NextRequest) {
  try {
    const { businessId, priceId, billingCycle, mode, amount, isUpgrade } = await request.json()
    
    const response = new NextResponse()
    const supabase = createRouteHandlerClient(request, response)
    
    // Verify the user owns this business
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: business } = await supabase
      .from("Business")
      .select("id, stripe_customer_id, name, email")
      .eq("id", businessId)
      .eq("userId", user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    // Create Stripe customer if not exists
    let stripeCustomerId = business.stripe_customer_id
    if (!stripeCustomerId) {
      const customer = await StripeService.createCustomer(
        business.id,
        business.email,
        business.name
      )
      stripeCustomerId = customer.id

      // Update business with Stripe customer ID
      await supabase
        .from("Business")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", business.id)
    }

    // Check for existing active subscription if this is a subscription mode
    if (mode !== "booster") {
      // First check if there's already a subscription in our database
      const { data: existingSubscription } = await supabase
        .from("Subscription")
        .select("id, stripe_customer_id, status")
        .eq("business_id", business.id)
        .in("status", ["active", "trialing", "past_due"])
        .single()
      
      if (existingSubscription) {
        // If subscription exists but business has wrong customer ID, fix it
        if (existingSubscription.stripe_customer_id !== stripeCustomerId) {
          console.log("Fixing mismatched stripe_customer_id:", {
            businessId: business.id,
            businessCustomerId: stripeCustomerId,
            subscriptionCustomerId: existingSubscription.stripe_customer_id
          })
          
          // Update business with correct customer ID from subscription
          stripeCustomerId = existingSubscription.stripe_customer_id
          await supabase
            .from("Business")
            .update({ stripe_customer_id: stripeCustomerId })
            .eq("id", business.id)
        }
        
        // Prevent creating duplicate subscriptions
        return NextResponse.json({ 
          error: "Sie haben bereits ein aktives Abonnement. Bitte verwenden Sie die Option 'Plan ändern' um Ihr Abonnement zu aktualisieren.",
          hasActiveSubscription: true,
          isUpgrade: true
        }, { status: 400 })
      }
      
      // Also check Stripe directly if we have a customer ID
      if (stripeCustomerId) {
        const hasActiveSubscription = await StripeService.hasActiveSubscription(stripeCustomerId)
        
        if (hasActiveSubscription) {
          // Prevent creating duplicate subscriptions
          return NextResponse.json({ 
            error: "Sie haben bereits ein aktives Abonnement in Stripe. Bitte verwenden Sie die Option 'Plan ändern' um Ihr Abonnement zu aktualisieren.",
            hasActiveSubscription: true
          }, { status: 400 })
        }
      }
    }

    // Get base URL with fallback for production
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NODE_ENV === 'production' ? 'https://www.nauw.ch' : 'http://localhost:3000')
    
    const successUrl = `${baseUrl}/billing?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/billing`

    let session

    if (mode === "booster") {
      // Create booster pack checkout
      session = await StripeService.createBoosterPackSession(
        business.id,
        stripeCustomerId,
        successUrl,
        cancelUrl,
        amount || 50
      )
    } else {
      // Create subscription checkout
      session = await StripeService.createCheckoutSession({
        businessId: business.id,
        customerId: stripeCustomerId,
        priceId,
        successUrl,
        cancelUrl,
        billingCycle
      })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { 
        error: "Failed to create checkout session",
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}