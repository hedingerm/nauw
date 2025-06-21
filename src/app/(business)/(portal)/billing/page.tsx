"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Progress } from "@/src/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { CreditCard, Package, Receipt, TrendingUp, AlertCircle, ExternalLink } from "lucide-react"
import { SubscriptionService, SubscriptionWithPlan } from "@/src/lib/services/subscription-service"
import { UsageService } from "@/src/lib/services/usage-service"
import { BillingService, Invoice } from "@/src/lib/services/billing-service"
import { createClient } from "@/src/lib/supabase/client"
import { formatCurrency } from "@/src/lib/utils"
import { Alert, AlertDescription } from "@/src/components/ui/alert"

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null)
  const [usageData, setUsageData] = useState<any>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [businessId, setBusinessId] = useState<string>("")

  useEffect(() => {
    loadBillingData()
  }, [])

  async function loadBillingData() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      // Get business ID
      const { data: business } = await supabase
        .from("Business")
        .select("id")
        .eq("userId", user.id)
        .single()

      if (!business) {
        router.push("/onboarding")
        return
      }

      setBusinessId(business.id)

      // Load subscription data
      const sub = await SubscriptionService.getBusinessSubscription(business.id)
      setSubscription(sub)

      // Load usage data
      if (sub) {
        const usage = await UsageService.getCurrentPeriodSummary(business.id)
        const percentage = await UsageService.getUsagePercentage(business.id)
        setUsageData({ ...usage, ...percentage })
      }

      // Load invoices
      const invoiceList = await BillingService.getBusinessInvoices(business.id)
      setInvoices(invoiceList)

    } catch (error) {
      console.error("Error loading billing data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade() {
    // Navigate to pricing page or open Stripe checkout
    router.push("/billing/upgrade")
  }

  async function handleManageSubscription() {
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId })
      })
      
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error opening billing portal:", error)
    }
  }

  async function handleAddBoosterPack() {
    router.push("/billing/booster")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const statusColors = {
    active: "bg-green-500",
    past_due: "bg-yellow-500",
    canceled: "bg-red-500",
    incomplete: "bg-gray-500",
    trialing: "bg-blue-500"
  }

  const statusLabels = {
    active: "Aktiv",
    past_due: "Überfällig",
    canceled: "Gekündigt",
    incomplete: "Unvollständig",
    trialing: "Testphase"
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Abrechnung & Abonnement</h1>
        <Button onClick={handleManageSubscription} variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          Zahlungsdaten verwalten
        </Button>
      </div>

      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Aktuelles Abonnement</span>
            {subscription && (
              <Badge className={statusColors[subscription.status as keyof typeof statusColors]}>
                {statusLabels[subscription.status as keyof typeof statusLabels]}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">{subscription.plan.name}</h3>
                  <p className="text-muted-foreground">
                    {formatCurrency(subscription.plan.price_monthly)} / Monat
                  </p>
                </div>
                <Button onClick={handleUpgrade}>Plan ändern</Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Nächste Abrechnung: {new Date(subscription.current_period_end).toLocaleDateString("de-CH")}</p>
                {subscription.cancel_at_period_end && (
                  <p className="text-red-600 mt-1">Kündigung zum Periodenende</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Kein aktives Abonnement</p>
              <Button onClick={handleUpgrade}>Abonnement starten</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      {subscription && usageData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Nutzungsübersicht
            </CardTitle>
            <CardDescription>
              Aktuelle Periode: {new Date(usageData.period_start).toLocaleDateString("de-CH")} - 
              {new Date(usageData.period_end).toLocaleDateString("de-CH")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!usageData.isUnlimited ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{usageData.used} von {usageData.total} Buchungen</span>
                    <span>{usageData.percentage}%</span>
                  </div>
                  <Progress value={usageData.percentage} className="h-2" />
                </div>

                {usageData.percentage >= 80 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Sie haben {usageData.percentage}% Ihres Kontingents verbraucht. 
                      Erwägen Sie ein Upgrade oder fügen Sie ein Booster Pack hinzu.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{usageData.included_bookings}</p>
                    <p className="text-sm text-muted-foreground">Inklusive Buchungen</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{usageData.booster_bookings}</p>
                    <p className="text-sm text-muted-foreground">Booster Buchungen</p>
                  </div>
                </div>

                {usageData.overage_bookings > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="font-semibold">Zusätzliche Buchungen: {usageData.overage_bookings}</p>
                    <p className="text-sm text-muted-foreground">
                      Kosten: {formatCurrency(usageData.overage_cost)} (CHF 0.50 pro Buchung)
                    </p>
                  </div>
                )}

                <Button onClick={handleAddBoosterPack} variant="outline" className="w-full">
                  <Package className="h-4 w-4 mr-2" />
                  Booster Pack hinzufügen (50 Buchungen für CHF 20)
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-2xl font-bold text-green-600">Unbegrenzte Buchungen</p>
                <p className="text-muted-foreground">
                  Sie haben {usageData.used} Buchungen in dieser Periode
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Rechnungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at!).toLocaleDateString("de-CH")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{formatCurrency(invoice.amount_total)}</span>
                    <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                      {invoice.status === "paid" ? "Bezahlt" : "Offen"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Noch keine Rechnungen vorhanden
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}