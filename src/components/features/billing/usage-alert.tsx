"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert"
import { Button } from "@/src/components/ui/button"
import { AlertCircle, TrendingUp } from "lucide-react"
import { UsageService } from "@/src/lib/services/usage-service"
import Link from "next/link"

interface UsageAlertProps {
  businessId: string
}

export function UsageAlert({ businessId }: UsageAlertProps) {
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsage()
  }, [businessId])

  async function loadUsage() {
    try {
      const usageData = await UsageService.getUsagePercentage(businessId)
      setUsage(usageData)
    } catch (error) {
      console.error("Error loading usage:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !usage || usage.isUnlimited) {
    return null
  }

  // Show alert at 80% usage
  if (usage.percentage >= 80) {
    const isNearLimit = usage.percentage >= 95
    const remainingBookings = usage.total - usage.used

    return (
      <Alert className={isNearLimit ? "border-red-500" : "border-yellow-500"}>
        <AlertCircle className={`h-4 w-4 ${isNearLimit ? "text-red-500" : "text-yellow-500"}`} />
        <AlertTitle>
          {isNearLimit ? "Buchungskontingent fast aufgebraucht!" : "Buchungskontingent läuft aus"}
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Sie haben {usage.used} von {usage.total} Buchungen verwendet ({usage.percentage}%).
            {remainingBookings > 0 && ` Nur noch ${remainingBookings} Buchungen verfügbar.`}
          </p>
          <div className="flex gap-2 mt-3">
            <Link href="/billing/booster">
              <Button size="sm" variant={isNearLimit ? "default" : "outline"}>
                <TrendingUp className="h-4 w-4 mr-1" />
                Booster Pack kaufen
              </Button>
            </Link>
            <Link href="/billing/upgrade">
              <Button size="sm" variant="outline">
                Plan upgraden
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}