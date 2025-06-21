'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { BusinessService } from '@/src/lib/services/business.service'
import { AppointmentService } from '@/src/lib/services/appointment.service'
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

interface RevenueData {
  todayRevenue: number
  yesterdayRevenue: number
  weekRevenue: number
  lastWeekRevenue: number
  monthRevenue: number
  lastMonthRevenue: number
  yearRevenue: number
  averageBookingValue: number
}

interface AppointmentStats {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  averageDuration: number
  busiestDay: string
  busiestHour: number
}

interface ServiceStats {
  serviceId: string
  serviceName: string
  bookingCount: number
  totalRevenue: number
  averagePrice: number
}

interface EmployeeStats {
  employeeId: string
  employeeName: string
  appointmentCount: number
  totalRevenue: number
  utilizationRate: number
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null)
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([])
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([])
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
        
        // Load all report data in parallel
        const [revenue, appointments] = await Promise.all([
          AppointmentService.getRevenueStats(businessData.id),
          AppointmentService.getAppointmentStats(businessData.id, selectedPeriod),
        ])
        
        // For now, we'll use the existing revenue stats
        // In a real implementation, we'd expand these services
        setRevenueData({
          todayRevenue: revenue.todayRevenue || 0,
          yesterdayRevenue: 0, // TODO: Implement
          weekRevenue: revenue.weekRevenue || 0,
          lastWeekRevenue: 0, // TODO: Implement
          monthRevenue: revenue.monthRevenue || 0,
          lastMonthRevenue: 0, // TODO: Implement
          yearRevenue: 0, // TODO: Implement
          averageBookingValue: revenue.averageBookingValue || 0,
        })
        
        // Mock data for demonstration - replace with actual service calls
        setAppointmentStats({
          totalAppointments: appointments.total || 0,
          completedAppointments: appointments.completed || 0,
          cancelledAppointments: appointments.cancelled || 0,
          noShowAppointments: 0,
          averageDuration: 60,
          busiestDay: 'Mittwoch',
          busiestHour: 14,
        })
        
        // Mock service stats
        setServiceStats([
          {
            serviceId: '1',
            serviceName: 'Haarschnitt',
            bookingCount: 45,
            totalRevenue: 2250,
            averagePrice: 50,
          },
          {
            serviceId: '2',
            serviceName: 'Färben',
            bookingCount: 23,
            totalRevenue: 2760,
            averagePrice: 120,
          },
          {
            serviceId: '3',
            serviceName: 'Styling',
            bookingCount: 18,
            totalRevenue: 540,
            averagePrice: 30,
          },
        ])
        
        // Mock employee stats
        setEmployeeStats([
          {
            employeeId: '1',
            employeeName: 'Anna Schmidt',
            appointmentCount: 42,
            totalRevenue: 2940,
            utilizationRate: 75,
          },
          {
            employeeId: '2',
            employeeName: 'Max Müller',
            appointmentCount: 38,
            totalRevenue: 2610,
            utilizationRate: 68,
          },
        ])
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
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
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
                <div className="text-2xl font-bold">{appointmentStats?.averageDuration || 0}</div>
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
              <div className="text-center py-8">
                <p className="text-muted-foreground">Diagramm kommt bald...</p>
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
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">diesen Monat</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Wiederkehrende</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68%</div>
                <p className="text-xs text-muted-foreground mt-1">Kundenbindungsrate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Ø Buchungswert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">CHF {revenueData.averageBookingValue}</div>
                <p className="text-xs text-muted-foreground mt-1">pro Kunde</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}