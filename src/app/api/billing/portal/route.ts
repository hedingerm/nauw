import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/src/lib/supabase/server"
import { StripeService } from "@/src/lib/services/stripe-service"

export async function POST(request: NextRequest) {
  try {
    const { businessId } = await request.json()
    
    const supabase = await createClient()
    
    // Verify the user owns this business
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: business } = await supabase
      .from("Business")
      .select("stripe_customer_id")
      .eq("id", businessId)
      .eq("userId", user.id)
      .single()

    if (!business || !business.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 })
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing`
    
    const session = await StripeService.createPortalSession({
      customerId: business.stripe_customer_id,
      returnUrl
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Portal session error:", error)
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    )
  }
}