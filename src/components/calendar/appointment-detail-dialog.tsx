'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Card } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import { CustomerService } from '@/src/lib/services/customer.service'
import type { AppointmentWithRelations } from '@/src/lib/schemas/appointment'
import type { CustomerWithRelations } from '@/src/lib/schemas/customer'
import { toast } from 'sonner'
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Euro, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface AppointmentDetailDialogProps {
  appointmentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppointmentDetailDialog({
  appointmentId,
  open,
  onOpenChange,
}: AppointmentDetailDialogProps) {
  const [appointment, setAppointment] = useState<AppointmentWithRelations | null>(null)
  const [customer, setCustomer] = useState<CustomerWithRelations | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (open && appointmentId) {
      loadAppointmentDetails()
    }
  }, [open, appointmentId])

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true)
      const appointmentData = await AppointmentService.getById(appointmentId)
      setAppointment(appointmentData)
      
      // Load full customer details
      if (appointmentData.customerId) {
        const customerData = await CustomerService.getById(appointmentData.customerId)
        setCustomer(customerData)
      }
    } catch (error) {
      console.error('Error loading appointment details:', error)
      toast.error('Fehler beim Laden der Termindetails')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: 'confirmed' | 'cancelled' | 'completed' | 'no_show') => {
    if (!appointment) return
    
    try {
      setUpdating(true)
      
      switch (newStatus) {
        case 'confirmed':
          await AppointmentService.confirm(appointment.id)
          break
        case 'cancelled':
          await AppointmentService.cancel(appointment.id)
          break
        case 'completed':
          await AppointmentService.complete(appointment.id)
          break
        case 'no_show':
          await AppointmentService.markNoShow(appointment.id)
          break
      }
      
      toast.success('Status erfolgreich aktualisiert')
      await loadAppointmentDetails()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Aktualisieren des Status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Bestätigt</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Ausstehend</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Abgesagt</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Abgeschlossen</Badge>
      case 'no_show':
        return <Badge className="bg-orange-100 text-orange-800">Nicht erschienen</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
      case 'no_show':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Termindetails</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!appointment) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Termindetails</DialogTitle>
            {getStatusBadge(appointment.status)}
          </div>
          <DialogDescription>
            {appointment.service?.name} • {appointment.employee?.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Termin</TabsTrigger>
            <TabsTrigger value="customer">Kunde</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Appointment Info */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(appointment.startTime), 'EEEE, d. MMMM yyyy', { locale: de })}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(appointment.startTime), 'HH:mm')} - 
                    {format(new Date(appointment.endTime), 'HH:mm')} Uhr
                  </span>
                </div>

                {appointment.service?.price && (
                  <div className="flex items-center gap-3">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span>CHF {appointment.service.price}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Notes */}
            {appointment.notes && (
              <Card className="p-4">
                <h4 className="font-medium mb-2">Notizen</h4>
                <p className="text-sm text-muted-foreground">{appointment.notes}</p>
              </Card>
            )}

            {/* Status Actions */}
            <div className="space-y-2">
              <h4 className="font-medium">Status ändern</h4>
              <div className="grid grid-cols-2 gap-2">
                {appointment.status !== 'confirmed' && appointment.status !== 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('confirmed')}
                    disabled={updating}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Bestätigen
                  </Button>
                )}
                
                {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updating}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Absagen
                  </Button>
                )}
                
                {appointment.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('completed')}
                    disabled={updating}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Abschließen
                  </Button>
                )}
                
                {appointment.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('no_show')}
                    disabled={updating}
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Nicht erschienen
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customer" className="space-y-4">
            {customer ? (
              <>
                {/* Customer Info */}
                <Card className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Kunde seit {format(new Date(customer.createdAt), 'MMMM yyyy', { locale: de })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${customer.email}`}
                        className="text-sm hover:underline"
                      >
                        {customer.email}
                      </a>
                    </div>
                    
                    {customer.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${customer.phone}`}
                          className="text-sm hover:underline"
                        >
                          {customer.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Customer Notes */}
                {customer.notes && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Kundennotizen</h4>
                    <p className="text-sm text-muted-foreground">{customer.notes}</p>
                  </Card>
                )}

                {/* Customer Stats */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Statistiken</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Termine insgesamt</p>
                      <p className="text-2xl font-semibold">{customer.appointmentCount || 0}</p>
                    </div>
                    {customer.lastAppointmentDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Letzter Besuch</p>
                        <p className="text-sm font-medium">
                          {format(new Date(customer.lastAppointmentDate), 'd. MMMM yyyy', { locale: de })}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.customer?.name}</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{appointment.customer?.email}</span>
                </div>
                {appointment.customer?.phone && (
                  <div className="flex items-center gap-3 mt-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{appointment.customer.phone}</span>
                  </div>
                )}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}