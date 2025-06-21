import { createClient } from "@/src/lib/supabase/client"
import { Tables, TablesInsert } from "@/src/lib/supabase/database.types"
import { SubscriptionService } from "./subscription.service"

export type UsageLog = Tables<"UsageLog">
export type CreateUsageLogInput = Omit<TablesInsert<"UsageLog">, "id" | "created_at">

export type UsageType = "booking" | "credit" | "overage" | "booster_pack"

export interface UsageSummary {
  period_start: string
  period_end: string
  total_bookings: number
  included_bookings: number
  overage_bookings: number
  booster_bookings: number
  overage_cost: number
}

export class UsageService {
  // Log a booking usage
  static async logBooking(
    businessId: string,
    appointmentId: string,
    description?: string
  ): Promise<UsageLog> {
    // Get the active subscription
    const subscription = await SubscriptionService.getBusinessSubscription(businessId)
    
    if (!subscription) {
      throw new Error("Kein aktives Abonnement gefunden")
    }

    const usageData: CreateUsageLogInput = {
      business_id: businessId,
      subscription_id: subscription.id,
      appointment_id: appointmentId,
      usage_type: "booking",
      amount: 1,
      description: description || "Terminbuchung",
      billing_period_start: subscription.current_period_start,
      billing_period_end: subscription.current_period_end
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("UsageLog")
      .insert(usageData)
      .select()
      .single()

    if (error) {
      console.error("Error logging usage:", error)
      throw new Error("Fehler beim Protokollieren der Nutzung")
    }

    return data
  }

  // Add booster pack credits
  static async addBoosterPack(
    businessId: string,
    amount: number = 50
  ): Promise<UsageLog> {
    const subscription = await SubscriptionService.getBusinessSubscription(businessId)
    
    if (!subscription) {
      throw new Error("Kein aktives Abonnement gefunden")
    }

    const usageData: CreateUsageLogInput = {
      business_id: businessId,
      subscription_id: subscription.id,
      usage_type: "booster_pack",
      amount: amount,
      description: `Booster Pack: ${amount} zusätzliche Buchungen`,
      billing_period_start: subscription.current_period_start,
      billing_period_end: subscription.current_period_end
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("UsageLog")
      .insert(usageData)
      .select()
      .single()

    if (error) {
      console.error("Error adding booster pack:", error)
      throw new Error("Fehler beim Hinzufügen des Booster Packs")
    }

    return data
  }

  // Get usage logs for a business
  static async getUsageLogs(
    businessId: string,
    startDate?: string,
    endDate?: string
  ): Promise<UsageLog[]> {
    const supabase = createClient()
    let query = supabase
      .from("UsageLog")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })

    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching usage logs:", error)
      throw new Error("Fehler beim Laden der Nutzungsprotokolle")
    }

    return data || []
  }

  // Get current period usage summary
  static async getCurrentPeriodSummary(businessId: string): Promise<UsageSummary> {
    const subscription = await SubscriptionService.getBusinessSubscription(businessId)
    
    if (!subscription) {
      throw new Error("Kein aktives Abonnement gefunden")
    }

    const usage = await SubscriptionService.getSubscriptionUsage(subscription.id)
    
    // Calculate overage cost (0.50 CHF per booking)
    const overage_cost = usage.overage_bookings * 0.50

    return {
      period_start: subscription.current_period_start,
      period_end: subscription.current_period_end,
      total_bookings: usage.total_bookings,
      included_bookings: usage.included_bookings,
      overage_bookings: usage.overage_bookings,
      booster_bookings: usage.booster_bookings,
      overage_cost
    }
  }

  // Remove a booking usage (e.g., when appointment is cancelled)
  static async removeBookingUsage(appointmentId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from("UsageLog")
      .delete()
      .eq("appointment_id", appointmentId)
      .eq("usage_type", "booking")

    if (error) {
      console.error("Error removing usage log:", error)
      // Don't throw error as this is not critical
    }
  }

  // Get usage percentage for display
  static async getUsagePercentage(businessId: string): Promise<{
    percentage: number
    used: number
    total: number
    isUnlimited: boolean
  }> {
    const subscription = await SubscriptionService.getBusinessSubscription(businessId)
    
    if (!subscription) {
      return { percentage: 0, used: 0, total: 0, isUnlimited: false }
    }

    const usage = await SubscriptionService.getSubscriptionUsage(subscription.id)
    
    // Elite plan has unlimited bookings
    if (subscription.plan.bookings_included === -1) {
      return {
        percentage: 0,
        used: usage.total_bookings,
        total: -1,
        isUnlimited: true
      }
    }

    const totalAllowed = usage.included_bookings + usage.booster_bookings
    const percentage = totalAllowed > 0 ? (usage.total_bookings / totalAllowed) * 100 : 0

    return {
      percentage: Math.min(100, Math.round(percentage)),
      used: usage.total_bookings,
      total: totalAllowed,
      isUnlimited: false
    }
  }

  // Check if nearing quota limit (80% or more)
  static async isNearingQuota(businessId: string): Promise<boolean> {
    const { percentage, isUnlimited } = await this.getUsagePercentage(businessId)
    return !isUnlimited && percentage >= 80
  }
}
