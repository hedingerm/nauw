import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/src/lib/supabase/server"
import { StripeService } from "@/src/lib/services/stripe-service"

export async function POST(request: NextRequest) {
  try {
    const { businessId, priceId, billingCycle, mode, amount } = await request.json()
    
    const supabase = await createClient()
    
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