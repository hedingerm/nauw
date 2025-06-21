import { createClient } from "@/src/lib/supabase/client"
import { Tables, TablesInsert, TablesUpdate } from "@/src/lib/supabase/database.types"

export type SubscriptionPlan = Tables<"SubscriptionPlan">
export type Subscription = Tables<"Subscription">
export type CreateSubscriptionInput = Omit<TablesInsert<"Subscription">, "id" | "created_at" | "updated_at">
export type UpdateSubscriptionInput = TablesUpdate<"Subscription">

export interface SubscriptionWithPlan {
  id: string
  business_id: string
  plan_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string
  status: string
  billing_cycle: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean | null
  canceled_at: string | null
  trial_end: string | null
  metadata: any | null
  created_at: string | null
  updated_at: string | null
  plan: SubscriptionPlan
}

export class SubscriptionService {
  // Get all available subscription plans
  static async getPlans(): Promise<SubscriptionPlan[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("SubscriptionPlan")
      .select("*")
      .eq("is_active", true)
      .order("display_order")

    if (error) {
      console.error("Error fetching subscription plans:", error)
      throw new Error("Fehler beim Laden der Abonnementpläne")
    }

    return data || []
  }

  // Alias for getPlans to match usage in upgrade page
  static async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    return this.getPlans()
  }

  // Get a specific plan by ID
  static async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("SubscriptionPlan")
      .select("*")
      .eq("id", planId)
      .single()

    if (error) {
      console.error("Error fetching plan:", error)
      return null
    }

    return data
  }

  // Get a specific plan by name
  static async getPlanByName(name: string): Promise<SubscriptionPlan | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("SubscriptionPlan")
      .select("*")
      .eq("name", name)
      .single()

    if (error) {
      console.error("Error fetching plan by name:", error)
      return null
    }

    return data
  }

  // Get subscription for a business
  static async getBusinessSubscription(businessId: string): Promise<SubscriptionWithPlan | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("Subscription")
      .select(`
        *,
        plan:SubscriptionPlan!plan_id(*)
      `)
      .eq("business_id", businessId)
      .eq("status", "active")
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No subscription found
        return null
      }
      console.error("Error fetching business subscription:", error)
      throw new Error("Fehler beim Laden des Abonnements")
    }

    return data as unknown as SubscriptionWithPlan
  }

  // Create a new subscription
  static async createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("Subscription")
      .insert(input)
      .select()
      .single()

    if (error) {
      console.error("Error creating subscription:", error)
      throw new Error("Fehler beim Erstellen des Abonnements")
    }

    // Update the business record with the subscription ID
    const { error: updateError } = await supabase
      .from("Business")
      .update({ subscription_id: data.id })
      .eq("id", input.business_id)

    if (updateError) {
      console.error("Error updating business with subscription ID:", updateError)
    }

    return data
  }

  // Update a subscription
  static async updateSubscription(
    subscriptionId: string,
    updates: UpdateSubscriptionInput
  ): Promise<Subscription> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("Subscription")
      .update(updates)
      .eq("id", subscriptionId)
      .select()
      .single()

    if (error) {
      console.error("Error updating subscription:", error)
      throw new Error("Fehler beim Aktualisieren des Abonnements")
    }

    return data
  }

  // Cancel a subscription (set to cancel at period end)
  static async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    return this.updateSubscription(subscriptionId, {
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString()
    })
  }

  // Reactivate a canceled subscription
  static async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    return this.updateSubscription(subscriptionId, {
      cancel_at_period_end: false,
      canceled_at: null
    })
  }

  // Check if a business has an active subscription
  static async hasActiveSubscription(businessId: string): Promise<boolean> {
    const subscription = await this.getBusinessSubscription(businessId)
    return subscription !== null && subscription.status === "active"
  }

  // Get subscription usage for current period
  static async getSubscriptionUsage(subscriptionId: string): Promise<{
    total_bookings: number
    included_bookings: number
    overage_bookings: number
    booster_bookings: number
  }> {
    const supabase = createClient()
    // Get the subscription to find the current period
    const { data: subscription, error: subError } = await supabase
      .from("Subscription")
      .select("current_period_start, current_period_end")
      .eq("id", subscriptionId)
      .single()

    if (subError || !subscription) {
      console.error("Error fetching subscription period:", subError)
      throw new Error("Fehler beim Laden der Abrechnungsperiode")
    }

    // Call the database function to calculate usage
    const { data, error } = await supabase.rpc("calculate_subscription_usage", {
      sub_id: subscriptionId,
      period_start: subscription.current_period_start,
      period_end: subscription.current_period_end
    })

    if (error) {
      console.error("Error calculating usage:", error)
      throw new Error("Fehler beim Berechnen der Nutzung")
    }

    return data[0] || {
      total_bookings: 0,
      included_bookings: 0,
      overage_bookings: 0,
      booster_bookings: 0
    }
  }

  // Check if business can make more bookings
  static async canMakeBooking(businessId: string): Promise<{
    allowed: boolean
    reason?: string
    usage?: {
      total: number
      included: number
      remaining: number
    }
  }> {
    try {
      const subscription = await this.getBusinessSubscription(businessId)
      
      if (!subscription) {
        return { allowed: false, reason: "Kein aktives Abonnement gefunden" }
      }

      if (subscription.status !== "active") {
        return { allowed: false, reason: "Abonnement ist nicht aktiv" }
      }

      const usage = await this.getSubscriptionUsage(subscription.id)
      
      // Elite plan has unlimited bookings (-1)
      if (subscription.plan.bookings_included === -1) {
        return { 
          allowed: true,
          usage: {
            total: usage.total_bookings,
            included: -1,
            remaining: -1
          }
        }
      }

      const totalAllowed = usage.included_bookings + usage.booster_bookings
      const remaining = totalAllowed - usage.total_bookings

      return {
        allowed: true, // Always allow with overage pricing
        usage: {
          total: usage.total_bookings,
          included: totalAllowed,
          remaining: Math.max(0, remaining)
        }
      }
    } catch (error) {
      console.error("Error checking booking allowance:", error)
      return { allowed: false, reason: "Fehler beim Überprüfen des Kontingents" }
    }
  }
}