'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Check } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Database } from '@/src/lib/supabase/database.types'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'

type Business = Database['public']['Tables']['Business']['Row']
type Service = Database['public']['Tables']['Service']['Row']
type Employee = Database['public']['Tables']['Employee']['Row']

interface AppointmentDetails {
  service: Service
  employee: Employee
  date: string
  // Add other fields as needed based on actual appointment structure
}

interface BookingConfirmationProps {
  business: Business
  config: BookingPageConfig | null
  appointmentDetails: AppointmentDetails
  selectedTime: string
  onNewBooking?: () => void
}

export function BookingConfirmation({
  business,
  config,
  appointmentDetails,
  selectedTime,
  onNewBooking
}: BookingConfirmationProps) {
  const router = useRouter()

  const handleNewBooking = () => {
    if (onNewBooking) {
      onNewBooking()
    } else {
      router.push('/')
    }
  }

  return (
    <div className="text-center py-8">
      <div className="mb-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl mb-2">
          {business.acceptAppointmentsAutomatically 
            ? 'Termin erfolgreich gebucht!' 
            : 'Terminanfrage gesendet!'}
        </CardTitle>
        <CardDescription>
          {config?.content.successMessage || (business.acceptAppointmentsAutomatically 
            ? 'Ihr Termin wurde bestätigt.' 
            : 'Ihre Anfrage wurde an das Unternehmen gesendet. Sie erhalten eine Bestätigung per E-Mail.')}
        </CardDescription>
      </div>

      <Card className="max-w-md mx-auto text-left">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Termindetails</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{appointmentDetails.service.name}</span>
            </div>
            {config?.features.showEmployeeNames && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mitarbeiter:</span>
                <span className="font-medium">{appointmentDetails.employee.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Datum:</span>
              <span className="font-medium">
                {format(parseISO(appointmentDetails.date), 'dd. MMMM yyyy', { locale: de })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zeit:</span>
              <span className="font-medium">{selectedTime} Uhr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dauer:</span>
              <span className="font-medium">{appointmentDetails.service.duration} Minuten</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preis:</span>
              <span className="font-medium">CHF {appointmentDetails.service.price.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleNewBooking} 
        className="mt-6"
        size="lg"
        style={{ backgroundColor: config?.theme.primaryColor }}
      >
        Neue Buchung
      </Button>
    </div>
  )
}