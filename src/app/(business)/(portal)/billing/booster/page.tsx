"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Package, Zap, TrendingUp } from "lucide-react"
import { createClient } from "@/src/lib/supabase/client"
import { formatCurrency } from "@/src/lib/utils"
import { Alert, AlertDescription } from "@/src/components/ui/alert"

export default function BoosterPackPage() {
  const router = useRouter()
  const [processing, setProcessing] = useState(false)

  async function handlePurchaseBooster() {
    setProcessing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      const { data: business } = await supabase
        .from("Business")
        .select("id")
        .eq("userId", user.id)
        .single()

      if (!business) return

      // Create checkout session for booster pack
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          mode: "booster",
          amount: 50
        })
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error purchasing booster pack:", error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Booster Pack</h1>
        <p className="text-muted-foreground">
          Erweitern Sie Ihr Buchungskontingent sofort
        </p>
      </div>

      <Card className="border-primary">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">50 zusätzliche Buchungen</CardTitle>
          <CardDescription>Einmalzahlung - kein Abonnement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-4xl font-bold">{formatCurrency(20)}</p>
            <p className="text-muted-foreground">Einmaliger Preis</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Sofort verfügbar</p>
                <p className="text-sm text-muted-foreground">
                  Die Buchungen werden Ihrem Konto sofort gutgeschrieben
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Kein Verfallsdatum</p>
                <p className="text-sm text-muted-foreground">
                  Die Buchungen bleiben verfügbar, bis sie aufgebraucht sind
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              Booster Pack Buchungen werden vor Überschreitungsbuchungen verwendet, 
              um zusätzliche Kosten zu vermeiden.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/billing")}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handlePurchaseBooster}
              disabled={processing}
              className="flex-1"
            >
              {processing ? "Verarbeitung..." : "Jetzt kaufen"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Haben Sie Fragen? Kontaktieren Sie uns unter support@nauw.ch</p>
      </div>
    </div>
  )
}