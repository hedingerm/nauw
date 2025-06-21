'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { BusinessService } from '@/src/lib/services/business.service'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import { useAuth } from '@/src/lib/auth/context'
import { 
  Calendar, 
  Plus,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  BarChart3,
  UserPlus,
  FileText,
  Briefcase
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default function DashboardPage() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [revenueStats, setRevenueStats] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const businessData = await BusinessService.getCurrentBusiness()
      if (businessData) {
        setBusiness(businessData)
        
        const [
          statsData,
          todayAppts,
          upcomingAppts,
          revenue,
          recentAppts
        ] = await Promise.all([
          BusinessService.getStats(businessData.id),
          AppointmentService.getTodaysAppointments(businessData.id),
          AppointmentService.getUpcomingAppointments(businessData.id, 3),
          AppointmentService.getRevenueStats(businessData.id),
          AppointmentService.getRecentAppointments(businessData.id, 5)
        ])
        
        setStats(statsData)
        setTodayAppointments(todayAppts)
        setUpcomingAppointments(upcomingAppts)
        setRevenueStats(revenue)
        setRecentActivity(recentAppts)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-semibold">Willkommen bei nauw!</h1>
        <p className="text-muted-foreground">
          Sie müssen zuerst Ihr Unternehmen einrichten.
        </p>
        <Button asChild>
          <Link href="/onboarding">Unternehmen einrichten</Link>
        </Button>
      </div>
    )
  }

  const pendingCount = stats?.pendingAppointments || 0
  const todayCount = stats?.todayAppointments || 0

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Guten Tag, {business.name}</h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
          </p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/appointments/new">
            <Plus className="mr-2 h-5 w-5" />
            Neuer Termin
          </Link>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Heute</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Termine
            </p>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {pendingCount} ausstehend
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Umsatz heute</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CHF {revenueStats?.todayRevenue || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayCount > 0 ? `Ø CHF ${Math.round((revenueStats?.todayRevenue || 0) / todayCount)}` : 'Keine Termine'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Aktive Kunden</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthAppointments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              diesen Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Aufgaben</CardTitle>
              {pendingCount > 0 ? (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingCount > 0 ? 'zu bestätigen' : 'Alles erledigt'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Today's Schedule & Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Heutiger Zeitplan</CardTitle>
                <CardDescription>Ihre Termine für heute</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/calendar">
                  Alle anzeigen <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground/20" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Keine Termine für heute
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href="/appointments/new">Termin erstellen</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayAppointments.map((appointment) => {
                    const startTime = format(new Date(appointment.startTime), 'HH:mm')
                    const isNow = new Date() >= new Date(appointment.startTime) && 
                                  new Date() <= new Date(appointment.endTime)
                    
                    return (
                      <div 
                        key={appointment.id} 
                        className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                          isNow ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="text-center min-w-[50px]">
                          <div className="text-sm font-medium">{startTime}</div>
                          {isNow && <Badge variant="default" className="text-xs mt-1">Jetzt</Badge>}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{appointment.Customer?.name || 'Unbekannt'}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.Service?.name} • {appointment.Employee?.name}
                          </p>
                        </div>
                        <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                          {appointment.status === 'confirmed' ? 'Bestätigt' : 'Ausstehend'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Nächste Termine</CardTitle>
              <CardDescription>Die nächsten 3 Tage</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Keine anstehenden Termine
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {appointment.Customer?.name} - {appointment.Service?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(appointment.startTime), 'EEEE, d. MMM • HH:mm', { locale: de })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {appointment.Employee?.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions, Revenue, Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Schnellaktionen</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/calendar">
                  <Calendar className="mr-2 h-4 w-4" />
                  Kalender öffnen
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/customers/new">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Kunde hinzufügen
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/reports">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Berichte anzeigen
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/services">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Services verwalten
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Revenue Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Umsatz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Diese Woche</span>
                <span className="font-semibold">CHF {revenueStats?.weekRevenue || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Diesen Monat</span>
                <span className="font-semibold">CHF {revenueStats?.monthRevenue || 0}</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ø pro Termin</span>
                  <span className="font-semibold">CHF {revenueStats?.averageBookingValue || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Aktivitäten</CardTitle>
              <CardDescription>Letzte Buchungen</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Noch keine Aktivitäten
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="text-sm">
                      <p className="font-medium">{activity.Customer?.name || 'Unbekannt'}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.Service?.name} • {format(new Date(activity.createdAt), 'dd.MM. HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}