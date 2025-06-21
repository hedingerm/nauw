'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { combineDateTimeToUTC } from '@/src/lib/utils/timezone'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { ServiceService } from '@/src/lib/services/service.service'
import { EmployeeService } from '@/src/lib/services/employee.service'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import { CustomerService } from '@/src/lib/services/customer.service'
import { AvailabilityService } from '@/src/lib/services/availability.service'
import { BusinessService } from '@/src/lib/services/business.service'
import { createAppointmentSchema, type CreateAppointmentInput } from '@/src/lib/schemas/appointment'
import { CustomerSearch } from '@/src/components/calendar/customer-search'
import { TimeSlotPicker } from '@/src/components/calendar/time-slot-picker'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Clock, Loader2, User, Briefcase, Users, FileText } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/src/lib/auth/context'
import type { TimeSlot } from '@/src/lib/services/availability.service'

// Form input type that matches the schema requirements
type FormInput = {
  customerId?: string
  serviceId: string
  employeeId: string
  startTime: string
  notes?: string
}

export default function NewAppointmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [business, setBusiness] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const form = useForm<FormInput>({
    resolver: zodResolver(createAppointmentSchema.pick({
      customerId: true,
      serviceId: true,
      employeeId: true,
      startTime: true,
      notes: true,
    })),
    defaultValues: {
      notes: '',
    },
    mode: 'onChange', // Enable real-time validation
  })

  const selectedServiceId = form.watch('serviceId')
  const selectedEmployeeId = form.watch('employeeId')

  useEffect(() => {
    loadData()
  }, [user])

  useEffect(() => {
    if (selectedServiceId) {
      loadEmployeesForService(selectedServiceId)
    }
  }, [selectedServiceId])

  useEffect(() => {
    if (selectedServiceId && selectedEmployeeId && selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedServiceId, selectedEmployeeId, selectedDate])

  const loadData = async () => {
    if (!user) return
    
    try {
      const businessData = await BusinessService.getCurrentBusiness()
      if (businessData) {
        setBusiness(businessData)
        
        const servicesData = await ServiceService.listActive(businessData.id)
        setServices(servicesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Fehler beim Laden der Daten')
    }
  }

  const loadEmployeesForService = async (serviceId: string) => {
    try {
      const employeesData = await EmployeeService.getByService(serviceId)
      setEmployees(employeesData)
      
      // Reset employee selection when service changes
      form.setValue('employeeId', '')
    } catch (error) {
      console.error('Error loading employees:', error)
      toast.error('Fehler beim Laden der Mitarbeiter')
    }
  }

  const loadAvailableSlots = async () => {
    try {
      setLoadingSlots(true)
      const slots = await AvailabilityService.getAvailableSlots({
        businessId: business!.id,
        serviceId: selectedServiceId,
        employeeId: selectedEmployeeId,
        date: format(selectedDate, 'yyyy-MM-dd'), // Convert Date to string
      })
      setAvailableTimeSlots(slots)
    } catch (error) {
      console.error('Error loading slots:', error)
      toast.error('Fehler beim Laden der verfügbaren Zeiten')
    } finally {
      setLoadingSlots(false)
    }
  }

  const onSubmit = async (data: FormInput) => {
    if (!business) return
    
    try {
      setLoading(true)
      
      const appointmentData: CreateAppointmentInput = {
        ...data,
        startTime: data.startTime, // Already in ISO format from time slot selection
        status: 'confirmed', // Default status for manually created appointments
      }
      
      await AppointmentService.create(business.id, appointmentData)
      
      toast.success('Termin erfolgreich erstellt')
      router.push('/calendar')
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      toast.error(error.message || 'Fehler beim Erstellen des Termins')
    } finally {
      setLoading(false)
    }
  }

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    // Store the full ISO datetime string
    form.setValue('startTime', slot.startTime)
  }

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer)
    form.setValue('customerId', customer.id)
  }

  const handleNewCustomer = async (customerData: any) => {
    try {
      const newCustomer = await CustomerService.create(business.id, customerData)
      setSelectedCustomer(newCustomer)
      form.setValue('customerId', newCustomer.id)
      toast.success('Kunde erfolgreich erstellt')
    } catch (error: any) {
      console.error('Error creating customer:', error)
      toast.error(error.message || 'Fehler beim Erstellen des Kunden')
    }
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Neuen Termin erstellen</h1>
          <p className="text-muted-foreground">Fügen Sie einen neuen Termin zu Ihrem Kalender hinzu</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Kunde
              </CardTitle>
              <CardDescription>Wählen Sie einen bestehenden Kunden oder erstellen Sie einen neuen</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerSearch
                businessId={business.id}
                onSelectCustomer={handleCustomerSelect}
                onNewCustomer={handleNewCustomer}
                selectedCustomer={selectedCustomer}
              />
            </CardContent>
          </Card>

          {/* Service and Employee Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Service & Mitarbeiter
              </CardTitle>
              <CardDescription>Wählen Sie den Service und den ausführenden Mitarbeiter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Service auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - {service.duration} Min. - CHF {service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mitarbeiter</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedServiceId || employees.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedServiceId 
                              ? "Wählen Sie zuerst einen Service" 
                              : employees.length === 0 
                                ? "Keine Mitarbeiter verfügbar" 
                                : "Mitarbeiter auswählen"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Date and Time Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Datum & Zeit
              </CardTitle>
              <CardDescription>Wählen Sie Datum und Uhrzeit für den Termin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormItem>
                <FormLabel>Datum</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uhrzeit</FormLabel>
                    <FormControl>
                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        <TimeSlotPicker
                          selectedDate={selectedDate}
                          availableSlots={availableTimeSlots}
                          initialTime={field.value}
                          onSelect={handleTimeSlotSelect}
                          disabled={!selectedServiceId || !selectedEmployeeId}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notizen
              </CardTitle>
              <CardDescription>Fügen Sie optionale Notizen zum Termin hinzu</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Besondere Wünsche oder Anmerkungen..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/calendar')}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                'Termin erstellen'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}