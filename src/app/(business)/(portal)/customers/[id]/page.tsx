'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BusinessService } from '@/src/lib/services/business.service'
import { CustomerService } from '@/src/lib/services/customer.service'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { 
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Gift,
  Star,
  Edit,
  MoreVertical,
  MessageSquare,
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Tag,
  Users as UsersIcon
} from 'lucide-react'
import { formatDate, formatTime } from '@/src/lib/utils/date'
import { formatCurrency } from '@/src/lib/utils/format'
import { formatPhoneForDisplay } from '@/src/lib/utils/normalize'
import type { Database } from '@/src/lib/supabase/database.types'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'

type Customer = Database['public']['Tables']['Customer']['Row']
type Appointment = Database['public']['Tables']['Appointment']['Row'] & {
  service?: { name: string; price: number }
  employee?: { name: string }
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [business, setBusiness] = useState<any>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Stats
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalSpent: 0,
    averageSpent: 0,
    lastVisit: null as string | null,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    noShowRate: 0,
  })

  useEffect(() => {
    loadBusiness()
  }, [])

  useEffect(() => {
    if (business) {
      loadCustomerData()
    }
  }, [business, customerId])

  const loadBusiness = async () => {
    try {
      const businessData = await BusinessService.getCurrentBusiness()
      setBusiness(businessData)
    } catch (error) {
      console.error('Error loading business:', error)
      toast.error('Fehler beim Laden der Geschäftsdaten')
    }
  }

  const loadCustomerData = async () => {
    if (!business || !customerId) return

    try {
      setLoading(true)
      
      // Load customer details
      const customerData = await CustomerService.getById(customerId)
      setCustomer(customerData)

      // Load appointments
      const { data: appointmentsData } = await CustomerService.getAppointmentHistory(customerId)
      const appointmentsWithDetails = appointmentsData || []
      setAppointments(appointmentsWithDetails)

      // Calculate stats
      calculateStats(appointmentsWithDetails)
    } catch (error) {
      console.error('Error loading customer data:', error)
      toast.error('Fehler beim Laden der Kundendaten')
      router.push('/customers')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (appointments: Appointment[]) => {
    const completedAppointments = appointments.filter(a => a.status === 'completed')
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled')
    const noShowAppointments = appointments.filter(a => a.status === 'no_show')
    const upcomingAppointments = appointments.filter(
      a => a.status === 'confirmed' && new Date(a.startTime) > new Date()
    )

    const totalSpent = completedAppointments.reduce(
      (sum, a) => sum + (a.service?.price || 0),
      0
    )

    const sortedAppointments = appointments
      .filter(a => ['completed', 'confirmed'].includes(a.status))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    setStats({
      totalVisits: completedAppointments.length,
      totalSpent,
      averageSpent: completedAppointments.length > 0 ? totalSpent / completedAppointments.length : 0,
      lastVisit: sortedAppointments[0]?.startTime || null,
      upcomingAppointments: upcomingAppointments.length,
      completedAppointments: completedAppointments.length,
      cancelledAppointments: cancelledAppointments.length,
      noShowRate: appointments.length > 0 
        ? (noShowAppointments.length / appointments.length) * 100 
        : 0,
    })
  }

  const handleEdit = () => {
    router.push(`/customers/${customerId}/edit`)
  }

  const handleBookAppointment = () => {
    router.push(`/appointments/new?customerId=${customerId}`)
  }

  const toggleVipStatus = async () => {
    if (!customer) return

    try {
      await CustomerService.update(customerId, {
        vipStatus: !customer.vipStatus,
      })
      toast.success(`${customer.vipStatus ? 'VIP-Status entfernt' : 'Als VIP markiert'}`)
      loadCustomerData()
    } catch (error) {
      console.error('Error toggling VIP status:', error)
      toast.error('Fehler beim Ändern des VIP-Status')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'no_show':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ausstehend'
      case 'confirmed': return 'Bestätigt'
      case 'completed': return 'Abgeschlossen'
      case 'cancelled': return 'Abgesagt'
      case 'no_show': return 'Nicht erschienen'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">Kundendaten werden geladen...</div>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  const initials = customer.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/customers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
                {customer.vipStatus && (
                  <Star className="h-6 w-6 text-yellow-500 fill-current" />
                )}
              </div>
              <p className="text-muted-foreground">
                Kunde seit {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Bearbeiten
          </Button>
          <Button onClick={handleBookAppointment}>
            <Calendar className="mr-2 h-4 w-4" />
            Termin buchen
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={toggleVipStatus}>
                {customer.vipStatus ? 'VIP-Status entfernen' : 'Als VIP markieren'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => CustomerService.toggleActive(customerId).then(loadCustomerData)}
              >
                {customer.isActive ? 'Deaktivieren' : 'Aktivieren'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Besuche</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            {stats.lastVisit && (
              <p className="text-xs text-muted-foreground">
                Letzter Besuch: {formatDate(stats.lastVisit)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Ø {formatCurrency(stats.averageSpent)} pro Besuch
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anstehende Termine</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.noShowRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="appointments">Termine</TabsTrigger>
          <TabsTrigger value="notes">Notizen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Kontaktinformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{formatPhoneForDisplay(customer.phone) || customer.phone}</span>
                    </div>
                  )}
                  {customer.birthday && (
                    <div className="flex items-center gap-2 text-sm">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                      <span>Geburtstag: {formatDate(customer.birthday)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {(customer.address || customer.city || customer.postalCode) && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {customer.address && <div>{customer.address}</div>}
                        {(customer.postalCode || customer.city) && (
                          <div>
                            {customer.postalCode} {customer.city}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {customer.tags && customer.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div className="flex gap-1 flex-wrap">
                        {customer.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bevorzugte Kontaktmethode</span>
                  <span>{customer.preferredContactMethod || 'E-Mail'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Marketing-Einwilligung</span>
                  <Badge variant={customer.marketingConsent ? "default" : "secondary"}>
                    {customer.marketingConsent ? 'Ja' : 'Nein'}
                  </Badge>
                </div>
                {customer.source && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quelle</span>
                    <span>{customer.source}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Allgemeine Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Terminhistorie</CardTitle>
              <CardDescription>
                Alle Termine dieses Kunden in chronologischer Reihenfolge
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Noch keine Termine vorhanden
                </p>
              ) : (
                <div className="space-y-4">
                  {appointments
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(appointment.status)}
                          <div>
                            <p className="font-medium">{appointment.service?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(appointment.startTime)} um {formatTime(appointment.startTime)}
                              {appointment.employee && ` · ${appointment.employee.name}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {getStatusLabel(appointment.status)}
                          </Badge>
                          {appointment.status === 'completed' && appointment.service?.price && (
                            <p className="text-sm font-medium mt-1">
                              {formatCurrency(appointment.service.price)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notizen</CardTitle>
              <CardDescription>
                Interne Notizen und Kommentare zu diesem Kunden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Notizen-Funktion wird in Kürze verfügbar sein
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}