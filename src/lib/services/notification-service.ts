import { createClient } from "@/src/lib/supabase/client"
import { SubscriptionService } from "./subscription-service"
import { UsageService } from "./usage-service"
import { BusinessService } from "./business.service"
import { EmailService } from "./email-service"

export interface NotificationData {
  to: string
  subject: string
  content: string
  businessId: string
  type: 'usage_warning' | 'usage_critical' | 'subscription_expired' | 'payment_failed'
}

export class NotificationService {
  // Send usage alert notifications
  static async sendUsageAlert(businessId: string, percentage: number): Promise<void> {
    try {
      const business = await BusinessService.getById(businessId)
      if (!business) return

      const subscription = await SubscriptionService.getBusinessSubscription(businessId)
      if (!subscription) return

      // Only send alerts for plans with limits (not unlimited)
      if (subscription.plan.bookings_included === -1) return

      const usage = await UsageService.getUsagePercentage(businessId)
      
      let subject: string
      let content: string
      let type: 'usage_warning' | 'usage_critical'

      if (percentage >= 95) {
        type = 'usage_critical'
        subject = "🚨 Kritisch: Buchungskontingent fast aufgebraucht"
        content = `
          <h2>Ihr Buchungskontingent ist fast aufgebraucht!</h2>
          <p>Sie haben bereits ${usage.used} von ${usage.total} Buchungen (${percentage}%) in diesem Monat verwendet.</p>
          <p><strong>Nur noch ${usage.total - usage.used} Buchungen verfügbar!</strong></p>
          <h3>Was können Sie tun?</h3>
          <ul>
            <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/billing/booster">Booster Pack kaufen</a> - 50 zusätzliche Buchungen für CHF 20</li>
            <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/billing/upgrade">Plan upgraden</a> - Mehr monatliche Buchungen</li>
          </ul>
          <p>Nach Überschreitung werden zusätzliche Buchungen mit CHF 0.50 pro Buchung berechnet.</p>
        `
      } else if (percentage >= 80) {
        type = 'usage_warning'
        subject = "⚠️ Warnung: Buchungskontingent läuft aus"
        content = `
          <h2>Ihr Buchungskontingent neigt sich dem Ende zu</h2>
          <p>Sie haben bereits ${usage.used} von ${usage.total} Buchungen (${percentage}%) in diesem Monat verwendet.</p>
          <p>Noch ${usage.total - usage.used} Buchungen verfügbar.</p>
          <h3>Planen Sie voraus:</h3>
          <ul>
            <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/billing/booster">Booster Pack kaufen</a> - 50 zusätzliche Buchungen für CHF 20</li>
            <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/billing/upgrade">Plan upgraden</a> - Mehr monatliche Buchungen</li>
          </ul>
        `
      } else {
        return // No alert needed
      }

      // Check if we already sent this alert recently (within 24 hours)
      const lastAlertKey = `last_${type}_alert_${businessId}`
      const lastAlert = await this.getLastAlertTime(lastAlertKey)
      
      if (lastAlert) {
        const hoursSinceLastAlert = (Date.now() - lastAlert.getTime()) / (1000 * 60 * 60)
        if (hoursSinceLastAlert < 24) {
          return // Don't spam with alerts
        }
      }

      // Send the notification
      await this.sendEmail({
        to: business.email,
        subject,
        content,
        businessId,
        type
      })

      // Record that we sent this alert
      await this.setLastAlertTime(lastAlertKey)

    } catch (error) {
      console.error("Error sending usage alert:", error)
    }
  }

  // Send email notification using Resend
  static async sendEmail(data: NotificationData): Promise<void> {
    try {
      // Get business details for the email
      const business = await BusinessService.getById(data.businessId)
      if (!business) {
        console.error("Business not found for notification:", data.businessId)
        return
      }

      // Get usage data if needed
      let emailData: any = {
        businessName: business.name,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }

      // Add type-specific data
      if (data.type === 'usage_warning' || data.type === 'usage_critical') {
        const usage = await UsageService.getUsagePercentage(data.businessId)
        emailData = {
          ...emailData,
          used: usage.used,
          total: usage.total,
          percentage: usage.percentage,
          remaining: usage.total - usage.used
        }
      } else if (data.type === 'payment_failed') {
        // Extract invoice amount from content if available
        const amountMatch = data.content.match(/CHF (\d+\.?\d*)/i)
        emailData.invoiceAmount = amountMatch ? parseFloat(amountMatch[1]) : 0
      }

      // Send the email
      const result = await EmailService.sendEmail({
        to: data.to,
        subject: data.subject,
        type: data.type as any,
        data: emailData
      })

      if (!result.success) {
        console.error("Failed to send email:", result.error)
      }

      // Store notification in database for audit trail
      const supabase = createClient()
      await supabase
        .from("Notification")
        .insert({
          business_id: data.businessId,
          type: data.type,
          subject: data.subject,
          content: data.content,
          email: data.to,
          sent_at: new Date().toISOString(),
          status: result.success ? 'sent' : 'failed',
          error: result.error
        })
    } catch (error) {
      console.error("Error in sendEmail:", error)
      
      // Still try to log the failed notification
      try {
        const supabase = createClient()
        await supabase
          .from("Notification")
          .insert({
            business_id: data.businessId,
            type: data.type,
            subject: data.subject,
            content: data.content,
            email: data.to,
            sent_at: new Date().toISOString(),
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
      } catch (logError) {
        console.error("Failed to log notification:", logError)
      }
    }
  }

  // Helper to track when we last sent an alert
  private static async getLastAlertTime(key: string): Promise<Date | null> {
    const supabase = createClient()
    const { data } = await supabase
      .from("NotificationLog")
      .select("sent_at")
      .eq("key", key)
      .order("sent_at", { ascending: false })
      .limit(1)
      .single()

    return data ? new Date(data.sent_at) : null
  }

  private static async setLastAlertTime(key: string): Promise<void> {
    const supabase = createClient()
    await supabase
      .from("NotificationLog")
      .upsert({
        key,
        sent_at: new Date().toISOString()
      })
  }

  // Check all businesses for usage alerts (to be called by a cron job)
  static async checkAllBusinessesForAlerts(): Promise<void> {
    const supabase = createClient()
    
    // Get all businesses with active subscriptions
    const { data: subscriptions } = await supabase
      .from("Subscription")
      .select("business_id")
      .eq("status", "active")

    if (!subscriptions) return

    // Check each business
    for (const sub of subscriptions) {
      try {
        const usage = await UsageService.getUsagePercentage(sub.business_id)
        if (!usage.isUnlimited && usage.percentage >= 80) {
          await this.sendUsageAlert(sub.business_id, usage.percentage)
        }
      } catch (error) {
        console.error(`Error checking alerts for business ${sub.business_id}:`, error)
      }
    }
  }

  // Send payment failed notification
  static async sendPaymentFailedNotification(businessId: string, invoiceAmount: number): Promise<void> {
    try {
      const business = await BusinessService.getById(businessId)
      if (!business) return

      await this.sendEmail({
        to: business.email,
        subject: "❌ Zahlung fehlgeschlagen",
        content: `
          <h2>Ihre Zahlung konnte nicht verarbeitet werden</h2>
          <p>Wir konnten die Zahlung von CHF ${invoiceAmount.toFixed(2)} für Ihr Abonnement nicht verarbeiten.</p>
          <h3>Was passiert jetzt?</h3>
          <p>Ihr Abonnement bleibt aktiv, aber bitte aktualisieren Sie Ihre Zahlungsmethode, um Unterbrechungen zu vermeiden.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/billing">Zahlungsmethode aktualisieren</a></p>
        `,
        businessId,
        type: 'payment_failed'
      })
    } catch (error) {
      console.error("Error sending payment failed notification:", error)
    }
  }
}