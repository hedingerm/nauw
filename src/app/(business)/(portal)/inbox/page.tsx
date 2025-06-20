'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import { useAuth } from '@/src/lib/auth/context'
import { BusinessService } from '@/src/lib/services/business.service'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Inbox, Clock, User, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { AppointmentWithRelations } from '@/src/lib/schemas/appointment'

interface InboxStats {
  pending: number
  todayPending: number
  thisWeekPending: number
}

export default function InboxPage() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [stats, setStats] = useState<InboxStats>({
    pending: 0,
    todayPending: 0,
    thisWeekPending: 0,
  })

  useEffect(() => {
    loadData()
  }, [user, activeTab])

  const loadData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load business
      const businessData = await BusinessService.getCurrentBusiness()
      setBusiness(businessData)
      
      if (!businessData) return

      // Load appointments based on active tab
      const status = activeTab === 'pending' 
        ? ['pending' as const] 
        : ['confirmed' as const, 'cancelled' as const]
      const appointmentsData = await AppointmentService.list({
        businessId: businessData.id,
        status,
      })

      setAppointments(appointmentsData)

      // Calculate stats
      const pendingAppointments = await AppointmentService.list({
        businessId: businessData.id,
        status: ['pending' as const],
      })

      const today = new Date()
      const todayStart = new Date(today.setHours(0, 0, 0, 0))
      const todayEnd = new Date(today.setHours(23, 59, 59, 999))
      
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() + 7)

      const stats: InboxStats = {
        pending: pendingAppointments.length,
        todayPending: pendingAppointments.filter(apt => {
          const aptDate = new Date(apt.startTime)
          return aptDate >= todayStart && aptDate <= todayEnd
        }).length,
        thisWeekPending: pendingAppointments.filter(apt => {
          const aptDate = new Date(apt.startTime)
          return aptDate <= weekEnd
        }).length,
      }

      setStats(stats)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (appointmentId: string) => {
    try {
      setProcessingId(appointmentId)
      await AppointmentService.update(appointmentId, {
        status: 'confirmed',
      })
      toast.success('Termin wurde bestätigt')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Bestätigen des Termins')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (appointmentId: string) => {
    try {
      setProcessingId(appointmentId)
      await AppointmentService.update(appointmentId, {
        status: 'cancelled',
      })
      toast.success('Termin wurde abgelehnt')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Ablehnen des Termins')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="mr-1 h-3 w-3" />Ausstehend</Badge>
      case 'confirmed':
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Bestätigt</Badge>
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Abgelehnt</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posteingang</h1>
          <p className="text-muted-foreground">
            Verwalten Sie eingehende Terminanfragen
          </p>
        </div>
        {business?.acceptAppointmentsAutomatically && (
          <Badge variant="outline" className="px-3 py-1">
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            Automatische Bestätigung aktiv
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehende Termine</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Warten auf Bestätigung
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heute ausstehend</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayPending}</div>
            <p className="text-xs text-muted-foreground">
              Termine für heute
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diese Woche</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeekPending}</div>
            <p className="text-xs text-muted-foreground">
              In den nächsten 7 Tagen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Ausstehend ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Bearbeitet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Keine ausstehenden Terminanfragen</p>
              </CardContent>
            </Card>
          ) : (
            appointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {appointment.service?.name}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(appointment.startTime), 'EEEE, d. MMMM yyyy', { locale: de })} um{' '}
                        {format(new Date(appointment.startTime), 'HH:mm')} Uhr
                      </CardDescription>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Kunde:</span>
                      <span>{appointment.customer?.name}</span>
                      {appointment.customer?.email && (
                        <span className="text-muted-foreground">({appointment.customer.email})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Mitarbeiter:</span>
                      <span>{appointment.employee?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Dauer:</span>
                      <span>{appointment.service?.duration} Minuten</span>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Notizen:</p>
                      <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                    </div>
                  )}

                  {appointment.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAccept(appointment.id)}
                        disabled={processingId === appointment.id}
                        className="flex-1"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Bestätigen
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(appointment.id)}
                        disabled={processingId === appointment.id}
                        className="flex-1"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Ablehnen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Keine bearbeiteten Termine</p>
              </CardContent>
            </Card>
          ) : (
            appointments.map((appointment) => (
              <Card key={appointment.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {appointment.service?.name}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(appointment.startTime), 'EEEE, d. MMMM yyyy', { locale: de })} um{' '}
                        {format(new Date(appointment.startTime), 'HH:mm')} Uhr
                      </CardDescription>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Kunde:</span>
                      <span>{appointment.customer?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Mitarbeiter:</span>
                      <span>{appointment.employee?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Bearbeitet am:</span>
                      <span>
                        {format(new Date(appointment.updatedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}