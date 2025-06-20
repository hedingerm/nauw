'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { BusinessService } from '@/src/lib/services/business.service'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import { useAuth } from '@/src/lib/auth/context'
import { Briefcase, Users, Calendar, UserCheck, Clock, TrendingUp, Activity, AlertCircle, ChevronRight } from 'lucide-react'
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
        
        // Load all dashboard data in parallel
        const [
          statsData,
          todayAppts,
          upcomingAppts,
          revenue,
          recentAppts
        ] = await Promise.all([
          BusinessService.getStats(businessData.id),
          AppointmentService.getTodaysAppointments(businessData.id),
          AppointmentService.getUpcomingAppointments(businessData.id, 7),
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

  const statCards = [
    {
      title: 'Heutige Termine',
      value: stats?.todayAppointments || 0,
      description: 'Termine für heute',
      icon: Calendar,
      href: '/calendar',
      trend: stats?.pendingAppointments > 0 ? `${stats.pendingAppointments} ausstehend` : null,
      trendColor: 'yellow',
    },
    {
      title: 'Umsatz heute',
      value: `CHF ${revenueStats?.todayRevenue || 0}`,
      description: 'Heutiger Umsatz',
      icon: TrendingUp,
      href: '/reports',
    },
    {
      title: 'Kunden',
      value: stats?.customers || 0,
      description: 'Registrierte Kunden',
      icon: UserCheck,
      href: '/customers',
      trend: `${stats?.monthAppointments || 0} diesen Monat`,
    },
    {
      title: 'Services',
      value: stats?.services || 0,
      description: 'Aktive Dienstleistungen',
      icon: Briefcase,
      href: '/services',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Willkommen zurück, {business.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
                {card.trend && (
                  <div className="mt-2">
                    <Badge variant={card.trendColor === 'yellow' ? 'secondary' : 'default'} className="text-xs">
                      {card.trend}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Today's Appointments Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Heutige Termine</CardTitle>
                <CardDescription>
                  {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/calendar">
                  Alle anzeigen <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Keine Termine für heute geplant
                </p>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="flex items-center space-x-4 rounded-lg border p-3">
                      <div className="flex-shrink-0">
                        <Clock className="h-10 w-10 rounded-full bg-primary/10 p-2 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {appointment.Customer?.name || 'Unbekannter Kunde'}
                          </p>
                          <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                            {appointment.status === 'confirmed' ? 'Bestätigt' : 'Ausstehend'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {appointment.Service?.name} • {appointment.Employee?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(appointment.startTime), 'HH:mm')} - 
                          {format(new Date(appointment.endTime), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Card */}
        <Card>
          <CardHeader>
            <CardTitle>Umsatzübersicht</CardTitle>
            <CardDescription>
              Aktuelle Umsatzzahlen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Heute</p>
              <p className="text-2xl font-bold">CHF {revenueStats?.todayRevenue || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Diese Woche</p>
              <p className="text-xl font-semibold">CHF {revenueStats?.weekRevenue || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Diesen Monat</p>
              <p className="text-xl font-semibold">CHF {revenueStats?.monthRevenue || 0}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">Durchschn. Buchungswert</p>
              <p className="text-lg font-semibold">CHF {revenueStats?.averageBookingValue || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Activity Feed */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
            <CardDescription>
              Häufig verwendete Funktionen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/appointments/new">
                <Calendar className="mr-2 h-4 w-4" />
                Neuen Termin erstellen
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/services/new">
                <Briefcase className="mr-2 h-4 w-4" />
                Service hinzufügen
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/employees/new">
                <Users className="mr-2 h-4 w-4" />
                Mitarbeiter hinzufügen
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Kalender öffnen
                {stats?.pendingAppointments > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {stats.pendingAppointments}
                  </Badge>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Letzte Aktivitäten</CardTitle>
            <CardDescription>
              Neue Buchungen und Änderungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Noch keine Aktivitäten
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">
                        {activity.Customer?.name || 'Unbekannt'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.Service?.name} • {format(new Date(activity.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                    <Badge variant={
                      activity.status === 'confirmed' ? 'default' : 
                      activity.status === 'pending' ? 'secondary' :
                      activity.status === 'cancelled' ? 'destructive' : 'outline'
                    } className="text-xs">
                      {activity.status === 'confirmed' ? 'Bestätigt' :
                       activity.status === 'pending' ? 'Ausstehend' :
                       activity.status === 'cancelled' ? 'Storniert' :
                       activity.status === 'completed' ? 'Abgeschlossen' : activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Kommende Termine</CardTitle>
            <CardDescription>
              Nächste 7 Tage
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/calendar">
              Kalender anzeigen <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Keine kommenden Termine
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingAppointments.slice(0, 10).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {appointment.Customer?.name} - {appointment.Service?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appointment.startTime), 'EEEE, d. MMMM • HH:mm', { locale: de })} Uhr
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {appointment.Employee?.name}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}