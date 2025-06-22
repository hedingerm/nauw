"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Calendar, Clock, User, Package, TrendingUp, Download } from "lucide-react"
import { UsageService, UsageLog } from "@/src/lib/services/usage.service"
import { formatDate, formatTime } from "@/src/lib/utils/date"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { de } from "date-fns/locale"

interface UsageDetailsProps {
  businessId: string
  subscriptionId?: string
}

export function UsageDetails({ businessId, subscriptionId }: UsageDetailsProps) {
  const [loading, setLoading] = useState(true)
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([])
  const [monthlyStats, setMonthlyStats] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState(0) // 0 = current month

  useEffect(() => {
    loadUsageData()
  }, [businessId, selectedMonth])

  async function loadUsageData() {
    try {
      setLoading(true)
      
      // Calculate date range for selected month
      const now = new Date()
      const targetMonth = subMonths(now, selectedMonth)
      const startDate = startOfMonth(targetMonth)
      const endDate = endOfMonth(targetMonth)
      
      // Load usage logs for the selected month
      const logs = await UsageService.getUsageLogs(
        businessId,
        startDate.toISOString(),
        endDate.toISOString()
      )
      setUsageLogs(logs)
      
      // Calculate daily stats for the month
      const dailyStats = calculateDailyStats(logs, startDate, endDate)
      setMonthlyStats(dailyStats)
      
    } catch (error) {
      console.error("Error loading usage data:", error)
    } finally {
      setLoading(false)
    }
  }

  function calculateDailyStats(logs: UsageLog[], startDate: Date, endDate: Date) {
    const stats: { [key: string]: number } = {}
    
    // Initialize all days in the month with 0
    const current = new Date(startDate)
    while (current <= endDate) {
      const key = format(current, "yyyy-MM-dd")
      stats[key] = 0
      current.setDate(current.getDate() + 1)
    }
    
    // Count bookings per day
    logs.forEach(log => {
      if (log.usage_type === "booking" && log.created_at) {
        const day = format(new Date(log.created_at), "yyyy-MM-dd")
        if (stats[day] !== undefined) {
          stats[day] += log.amount
        }
      }
    })
    
    // Convert to array for chart
    return Object.entries(stats).map(([date, count]) => ({
      date,
      count,
      dayName: format(new Date(date), "EEE", { locale: de }),
      dayNumber: format(new Date(date), "d")
    }))
  }

  async function handleExportData() {
    // Create CSV data
    const headers = ["Datum", "Typ", "Beschreibung", "Menge", "Termin-ID"]
    const rows = usageLogs.map(log => [
      log.created_at ? formatDate(log.created_at) : "",
      log.usage_type,
      log.description || "",
      log.amount.toString(),
      log.appointment_id || ""
    ])
    
    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")
    
    // Download CSV
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `nutzung_${format(new Date(), "yyyy-MM")}.csv`
    link.click()
  }

  const getUsageTypeLabel = (type: string) => {
    switch (type) {
      case "booking": return "Buchung"
      case "booster_pack": return "Booster Pack"
      case "credit": return "Guthaben"
      case "overage": return "Überschreitung"
      default: return type
    }
  }

  const getUsageTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "booking": return "default"
      case "booster_pack": return "secondary"
      case "credit": return "outline"
      case "overage": return "destructive"
      default: return "default"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const currentMonthName = format(subMonths(new Date(), selectedMonth), "MMMM yyyy", { locale: de })
  const bookingCount = usageLogs.filter(log => log.usage_type === "booking").reduce((sum, log) => sum + log.amount, 0)
  const boosterCount = usageLogs.filter(log => log.usage_type === "booster_pack").reduce((sum, log) => sum + log.amount, 0)

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={selectedMonth === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedMonth(0)}
          >
            Aktueller Monat
          </Button>
          <Button
            variant={selectedMonth === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedMonth(1)}
          >
            Letzter Monat
          </Button>
          <Button
            variant={selectedMonth === 2 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedMonth(2)}
          >
            Vor 2 Monaten
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Exportieren
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Buchungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bookingCount}</p>
            <p className="text-xs text-muted-foreground">{currentMonthName}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Booster Packs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{boosterCount}</p>
            <p className="text-xs text-muted-foreground">Zusätzliche Buchungen</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Durchschnitt/Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {monthlyStats.length > 0 ? (bookingCount / monthlyStats.length).toFixed(1) : "0"}
            </p>
            <p className="text-xs text-muted-foreground">Buchungen pro Tag</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tägliche Nutzung</CardTitle>
          <CardDescription>Buchungen pro Tag in {currentMonthName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div className="flex gap-1 min-w-[800px] h-32">
              {monthlyStats.map((day, index) => {
                const maxCount = Math.max(...monthlyStats.map(d => d.count), 1)
                const height = (day.count / maxCount) * 100
                const isToday = day.date === format(new Date(), "yyyy-MM-dd")
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end">
                    <div 
                      className={`w-full bg-primary/20 hover:bg-primary/30 transition-colors rounded-t ${isToday ? "ring-2 ring-primary" : ""}`}
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                      title={`${day.count} Buchungen am ${format(new Date(day.date), "d. MMMM", { locale: de })}`}
                    />
                    <span className="text-xs text-muted-foreground mt-1">
                      {index % 5 === 0 ? day.dayNumber : ""}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detaillierte Nutzungsprotokolle</CardTitle>
          <CardDescription>Alle Nutzungsereignisse in {currentMonthName}</CardDescription>
        </CardHeader>
        <CardContent>
          {usageLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Zeit</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-right">Menge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.created_at ? formatDate(log.created_at) : "-"}</TableCell>
                    <TableCell>{log.created_at ? formatTime(log.created_at) : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getUsageTypeBadgeVariant(log.usage_type)}>
                        {getUsageTypeLabel(log.usage_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.description || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{log.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Keine Nutzungsdaten für {currentMonthName} vorhanden
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}