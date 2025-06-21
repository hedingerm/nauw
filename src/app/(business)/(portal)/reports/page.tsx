'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { BusinessService } from '@/src/lib/services/business.service'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import { ReportService } from '@/src/lib/services/report.service'
import { useAuth } from '@/src/lib/auth/context'
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  BarChart3,
  Download,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { de } from 'date-fns/locale'
import { SimpleBarChart } from '@/src/components/ui/simple-chart'

import type { 
  RevenueComparison,
  ServiceStatistics,
  EmployeeStatistics,
  CustomerStatistics,
  TimeAnalytics
} from '@/src/lib/services/report.service'

export default function ReportsPage() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<RevenueComparison | null>(null)
  const [appointmentStats, setAppointmentStats] = useState<any>(null)
  const [serviceStats, setServiceStats] = useState<ServiceStatistics[]>([])
  const [employeeStats, setEmployeeStats] = useState<EmployeeStatistics[]>([])
  const [customerStats, setCustomerStats] = useState<CustomerStatistics | null>(null)
  const [timeAnalytics, setTimeAnalytics] = useState<TimeAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    loadData()
  }, [user, selectedPeriod])

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const businessData = await BusinessService.getCurrentBusiness()
      
      if (businessData) {
        setBusiness(businessData)
        
        // Calculate date ranges based on selected period
        const now = new Date()
        let startDate: Date
        let endDate = new Date()
        
        switch (selectedPeriod) {
          case 'week':
            startDate = startOfWeek(now, { weekStartsOn: 1 })
            endDate = endOfWeek(now, { weekStartsOn: 1 })
            break
          case 'month':
            startDate = startOfMonth(now)
            endDate = endOfMonth(now)
            break
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1)
            endDate = new Date(now.getFullYear(), 11, 31)
            break
        }
        
        // Load all report data in parallel
        const [
          revenue,
          appointments,
          services,
          employees,
          customers,
          time
        ] = await Promise.all([
          ReportService.getRevenueComparison(businessData.id),
          AppointmentService.getAppointmentStats(businessData.id, selectedPeriod),
          ReportService.getServiceStatistics(businessData.id, startDate, endDate),
          ReportService.getEmployeeStatistics(businessData.id, startDate, endDate),
          ReportService.getCustomerStatistics(businessData.id, startDate, endDate),
          ReportService.getTimeAnalytics(businessData.id, startDate, endDate)
        ])
        
        setRevenueData(revenue)
        setAppointmentStats(appointments)
        setServiceStats(services)
        setEmployeeStats(employees)
        setCustomerStats(customers)
        setTimeAnalytics(time)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Fehler beim Laden der Berichte')
    } finally {
      setLoading(false)
    }
  }

  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const handleExport = async () => {
    if (!business) return

    try {
      // Calculate date range for export
      const now = new Date()
      let startDate: Date
      let endDate = new Date()
      
      switch (selectedPeriod) {
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 })
          endDate = endOfWeek(now, { weekStartsOn: 1 })
          break
        case 'month':
          startDate = startOfMonth(now)
          endDate = endOfMonth(now)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          endDate = new Date(now.getFullYear(), 11, 31)
          break
      }

      // Get CSV data
      const csv = await ReportService.exportAppointmentsCSV(business.id, startDate, endDate)
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `termine_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Export erfolgreich!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Fehler beim Exportieren der Daten')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!business || !revenueData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Keine Daten verfügbar</p>
      </div>
    )
  }

  const todayTrend = calculateTrend(revenueData.todayRevenue, revenueData.yesterdayRevenue)
  const weekTrend = calculateTrend(revenueData.weekRevenue, revenueData.lastWeekRevenue)
  const monthTrend = calculateTrend(revenueData.monthRevenue, revenueData.lastMonthRevenue)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Berichte & Analysen</h1>
          <p className="text-muted-foreground">
            Übersicht über Ihre Geschäftskennzahlen
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={(value: 'week' | 'month' | 'year') => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Zeitraum wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Diese Woche</SelectItem>
              <SelectItem value="month">Diesen Monat</SelectItem>
              <SelectItem value="year">Dieses Jahr</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Heute</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CHF {revenueData.todayRevenue}</div>
            <div className="flex items-center gap-2 mt-2">
              {todayTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${todayTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {todayTrend > 0 && '+'}{todayTrend}% vs. gestern
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Diese Woche</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CHF {revenueData.weekRevenue}</div>
            <div className="flex items-center gap-2 mt-2">
              {weekTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${weekTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {weekTrend > 0 && '+'}{weekTrend}% vs. letzte Woche
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Diesen Monat</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CHF {revenueData.monthRevenue}</div>
            <div className="flex items-center gap-2 mt-2">
              {monthTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${monthTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {monthTrend > 0 && '+'}{monthTrend}% vs. letzten Monat
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      {revenueData && (
        <Card>
          <CardHeader>
            <CardTitle>Umsatztrend</CardTitle>
            <CardDescription>Vergleich zum Vorperiode</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={[
                { label: 'Heute', value: revenueData.todayRevenue },
                { label: 'Gestern', value: revenueData.yesterdayRevenue },
                { label: 'Diese Woche', value: revenueData.weekRevenue },
                { label: 'Letzte Woche', value: revenueData.lastWeekRevenue },
              ]}
              height={180}
            />
          </CardContent>
        </Card>
      )}

      {/* Detailed Reports Tabs */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appointments">Termine</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="employees">Mitarbeiter</TabsTrigger>
          <TabsTrigger value="customers">Kunden</TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Gesamt Termine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appointmentStats?.totalAppointments || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">in diesem Zeitraum</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {appointmentStats?.completedAppointments || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {appointmentStats && appointmentStats.totalAppointments > 0
                    ? `${Math.round((appointmentStats.completedAppointments / appointmentStats.totalAppointments) * 100)}% Erfolgsquote`
                    : 'Keine Daten'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Storniert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {appointmentStats?.cancelledAppointments || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {appointmentStats && appointmentStats.totalAppointments > 0
                    ? `${Math.round((appointmentStats.cancelledAppointments / appointmentStats.totalAppointments) * 100)}% Stornierungsrate`
                    : 'Keine Daten'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Ø Dauer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timeAnalytics?.averageDuration || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Minuten pro Termin</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Auslastung nach Wochentag</CardTitle>
              <CardDescription>Verteilung der Termine über die Woche</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeAnalytics?.busiestDays.slice(0, 7).map((day) => (
                  <div key={day.dayOfWeek} className="flex items-center justify-between">
                    <span className="text-sm font-medium w-24">{day.dayName}</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ 
                            width: `${timeAnalytics.busiestDays[0].appointmentCount > 0 
                              ? (day.appointmentCount / timeAnalytics.busiestDays[0].appointmentCount) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {day.appointmentCount}
                    </span>
                  </div>
                ))}
                {timeAnalytics && timeAnalytics.busiestDays.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Beliebtester Tag: {timeAnalytics.busiestDays[0].dayName} 
                    ({timeAnalytics.busiestDays[0].appointmentCount} Termine)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Services</CardTitle>
              <CardDescription>Ihre beliebtesten Dienstleistungen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceStats.map((service, index) => (
                  <div key={service.serviceId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{service.serviceName}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.bookingCount} Buchungen
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">CHF {service.totalRevenue}</p>
                      <p className="text-sm text-muted-foreground">
                        Ø CHF {service.averagePrice}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mitarbeiter Performance</CardTitle>
              <CardDescription>Leistungsübersicht Ihrer Mitarbeiter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeStats.map((employee) => (
                  <div key={employee.employeeId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{employee.employeeName}</p>
                      <Badge variant={employee.utilizationRate > 70 ? 'default' : 'secondary'}>
                        {employee.utilizationRate}% Auslastung
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{employee.appointmentCount} Termine</span>
                      <span>CHF {employee.totalRevenue} Umsatz</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${employee.utilizationRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Neue Kunden</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerStats?.newCustomers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">in diesem Zeitraum</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Wiederkehrende</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerStats?.retentionRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">Kundenbindungsrate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Ø Buchungswert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">CHF {customerStats?.averageBookingValue || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">pro Buchung</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          {customerStats && customerStats.topCustomers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Kunden</CardTitle>
                <CardDescription>Ihre umsatzstärksten Kunden</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerStats.topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.customerId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{customer.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.appointmentCount} Termine
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">CHF {customer.totalSpent}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}