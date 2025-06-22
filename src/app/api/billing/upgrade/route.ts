import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/src/lib/supabase/route-handler"
import { StripeService } from "@/src/lib/services/stripe.service"
import { SubscriptionService, SubscriptionWithPlan } from "@/src/lib/services/subscription.service"

export async function POST(request: NextRequest) {
  try {
    const { businessId, newPriceId, billingCycle } = await request.json()
    
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

    // Check if business has a Stripe customer ID - but we'll also check subscription's customer ID
    if (!business.stripe_customer_id) {
      console.log("Business has no stripe_customer_id, will check subscription for customer ID")
    }

    // Get current active subscription using the route handler client
    const { data: subscription, error: subError } = await supabase
      .from("Subscription")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "active")
      .single()
    
    console.log("Subscription query result:", {
      businessId,
      stripeCustomerId: business.stripe_customer_id,
      hasSubscription: !!subscription,
      error: subError
    })
    
    if (!subscription || subError) {
      // Try to get any subscription for debugging
      const { data: allSubs } = await supabase
        .from("Subscription")
        .select("id, status, stripe_subscription_id")
        .eq("business_id", businessId)
      
      console.log("All subscriptions for business:", allSubs)
      
      return NextResponse.json({ 
        error: "Kein aktives Abonnement gefunden. Bitte erstellen Sie zuerst ein Abonnement." 
      }, { status: 400 })
    }

    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from("SubscriptionPlan")
      .select("*")
      .eq("id", subscription.plan_id)
      .single()

    if (!plan || planError) {
      console.error("Error fetching plan:", planError)
      return NextResponse.json({ 
        error: "Fehler beim Laden des Tarifs." 
      }, { status: 400 })
    }

    const currentSubscription = {
      ...subscription,
      plan
    } as SubscriptionWithPlan

    // Check if there's a Stripe subscription ID
    if (!currentSubscription.stripe_subscription_id) {
      return NextResponse.json({ 
        error: "Kein Stripe-Abonnement gefunden." 
      }, { status: 400 })
    }

    // Get the subscription from Stripe to check its actual status
    const stripeSubscription = await StripeService.getSubscription(
      currentSubscription.stripe_subscription_id
    )

    // Check if subscription status allows updates
    const nonUpdatableStatuses = ['incomplete_expired', 'incomplete', 'canceled', 'unpaid']
    if (nonUpdatableStatuses.includes(stripeSubscription.status)) {
      // Update our database to reflect the correct status
      await supabase
        .from("Subscription")
        .update({ status: stripeSubscription.status })
        .eq("id", currentSubscription.id)

      console.log("Subscription has non-updatable status:", {
        subscriptionId: currentSubscription.id,
        stripeStatus: stripeSubscription.status,
        previousDbStatus: currentSubscription.status
      })

      return NextResponse.json({ 
        error: "Ihr aktuelles Abonnement kann nicht aktualisiert werden. Bitte erstellen Sie ein neues Abonnement.",
        details: `Abonnementstatus: ${stripeSubscription.status}`,
        requiresNewSubscription: true
      }, { status: 400 })
    }

    // Update the subscription in Stripe
    const updatedSubscription = await StripeService.updateSubscription(
      currentSubscription.stripe_subscription_id,
      newPriceId,
      { billingCycle }
    )
    
    // Get period dates from subscription items
    const periodEnd = updatedSubscription.items.data[0]?.current_period_end
    const periodStart = updatedSubscription.items.data[0]?.current_period_start
    
    // If the subscription has a different customer ID than the business, update the business
    if (currentSubscription.stripe_customer_id && 
        currentSubscription.stripe_customer_id !== business.stripe_customer_id) {
      console.log("Updating business with correct stripe_customer_id from subscription:", {
        businessId: business.id,
        oldCustomerId: business.stripe_customer_id,
        newCustomerId: currentSubscription.stripe_customer_id
      })
      
      await supabase
        .from("Business")
        .update({ stripe_customer_id: currentSubscription.stripe_customer_id })
        .eq("id", business.id)
    }

    // Return success response
    return NextResponse.json({ 
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        current_period_end: periodEnd 
          ? new Date(periodEnd * 1000).toISOString()
          : null
      },
      message: "Ihr Abonnement wurde erfolgreich aktualisiert."
    })
    
  } catch (error) {
    console.error("Upgrade error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { 
        error: "Fehler beim Aktualisieren des Abonnements",
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}