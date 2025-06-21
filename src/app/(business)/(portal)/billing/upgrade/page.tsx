"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group"
import { Label } from "@/src/components/ui/label"
import { Check, Zap } from "lucide-react"
import { SubscriptionService, SubscriptionPlan } from "@/src/lib/services/subscription-service"
import { createClient } from "@/src/lib/supabase/client"
import { formatCurrency } from "@/src/lib/utils"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { toast } from "sonner"

export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const [businessId, setBusinessId] = useState<string>("")
  const [stripeCustomerId, setStripeCustomerId] = useState<string>("")

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      // Get business and subscription info
      const { data: business } = await supabase
        .from("Business")
        .select("id, stripe_customer_id")
        .eq("userId", user.id)
        .single()

      if (!business) {
        router.push("/onboarding")
        return
      }

      setBusinessId(business.id)
      setStripeCustomerId(business.stripe_customer_id || "")

      // Load all plans
      const allPlans = await SubscriptionService.getAvailablePlans()
      setPlans(allPlans)

      // Get current subscription
      const subscription = await SubscriptionService.getBusinessSubscription(business.id)
      if (subscription) {
        setCurrentPlan(subscription.plan)
        setBillingCycle(subscription.billing_cycle as "monthly" | "annual")
      }

    } catch (error) {
      console.error("Error loading plans:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectPlan() {
    if (!selectedPlanId || processing) return

    setProcessing(true)
    try {
      const selectedPlan = plans.find(p => p.id === selectedPlanId)
      if (!selectedPlan) return

      const priceId = billingCycle === "annual" 
        ? selectedPlan.stripe_price_annual_id 
        : selectedPlan.stripe_price_monthly_id

      // Create checkout session
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          priceId,
          billingCycle,
          mode: currentPlan ? "upgrade" : "subscription"
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error("Checkout error:", data)
        toast.error(data.details || "Fehler beim Erstellen der Checkout-Sitzung")
        return
      }
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const planFeatures: Record<string, string[]> = {
    Starter: [
      "Bis zu 30 Buchungen/Monat",
      "1 Kalender",
      "Online-Buchungsseite",
      "E-Mail Erinnerungen"
    ],
    Pro: [
      "Alle Starter-Features",
      "Bis zu 100 Buchungen/Monat",
      "Unbegrenzte Kalender",
      "SMS Erinnerungen"
    ],
    Business: [
      "Alle Pro-Features",
      "Bis zu 300 Buchungen/Monat",
      "Detaillierte Analysen",
      "Team Support"
    ],
    Elite: [
      "Alle Business-Features",
      "Unbegrenzte Buchungen",
      "Prioritäts-Support",
      "Persönlicher Ansprechpartner"
    ]
  }

  const planDescriptions: Record<string, string> = {
    Starter: "Perfekt für Einzelunternehmer und Freelancer",
    Pro: "Ideal für kleine Teams und wachsende Unternehmen",
    Business: "Für etablierte Unternehmen mit hohem Buchungsvolumen",
    Elite: "Unbegrenzte Möglichkeiten für große Unternehmen"
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Wählen Sie Ihren Plan</h1>
        <p className="text-muted-foreground">
          Upgrade oder Downgrade jederzeit. Keine versteckten Gebühren.
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <RadioGroup
          value={billingCycle}
          onValueChange={(value) => setBillingCycle(value as "monthly" | "annual")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="monthly" id="monthly" />
            <Label htmlFor="monthly">Monatlich</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="annual" id="annual" />
            <Label htmlFor="annual" className="flex items-center gap-2">
              Jährlich
              <Badge variant="secondary" className="text-xs">20% Rabatt</Badge>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan?.id === plan.id
          const price = billingCycle === "annual" 
            ? plan.price_annual / 12 
            : plan.price_monthly
          const features = planFeatures[plan.name] || []
          const description = planDescriptions[plan.name] || ""

          return (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all ${
                selectedPlanId === plan.id 
                  ? "ring-2 ring-primary" 
                  : ""
              } ${isCurrentPlan ? "bg-primary/5" : ""}`}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              {isCurrentPlan && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Aktueller Plan
                </Badge>
              )}
              
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">{formatCurrency(price)}</span>
                  <span className="text-muted-foreground">/Monat</span>
                  {billingCycle === "annual" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(plan.price_annual)} jährlich
                    </p>
                  )}
                </div>

                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.bookings_included > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Zusätzliche Buchungen verfügbar über Booster Packs
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/billing")}
        >
          Abbrechen
        </Button>
        <Button
          onClick={handleSelectPlan}
          disabled={!selectedPlanId || selectedPlanId === currentPlan?.id || processing}
        >
          {processing ? (
            "Verarbeitung..."
          ) : currentPlan ? (
            "Plan ändern"
          ) : (
            "Plan auswählen"
          )}
        </Button>
      </div>

      {currentPlan && selectedPlanId && selectedPlanId !== currentPlan.id && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            {plans.find(p => p.id === selectedPlanId)?.bookings_included! > currentPlan.bookings_included
              ? "Ihr neues Kontingent wird sofort verfügbar sein."
              : "Bereits genutzte Buchungen über dem neuen Limit werden normal abgerechnet."
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}