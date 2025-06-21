'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Linkedin, Youtube, Music2 } from 'lucide-react'
import { format } from 'date-fns'
import Head from 'next/head'
import { BookingPageHeader } from '@/src/components/booking/booking-page-header'
import { StepIndicator } from '@/src/components/booking/step-indicator'
import { ServiceSelector } from '@/src/components/booking/service-selector'
import { DateTimePicker } from '@/src/components/booking/date-time-picker'
import { EmployeeSelector } from '@/src/components/booking/employee-selector'
import { CustomerForm, type CustomerFormData } from '@/src/components/booking/customer-form'
import { BookingConfirmation } from '@/src/components/booking/booking-confirmation'
import { useBookingData } from '@/src/hooks/booking/use-booking-data'
import { useAvailability } from '@/src/hooks/booking/use-availability'
import { CustomerService } from '@/src/lib/services/customer.service'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import { BookingPageConfigService } from '@/src/lib/services/booking-config.service'
import { cn } from '@/src/lib/utils/cn'
import type { Database } from '@/src/lib/supabase/database.types'

type Service = Database['public']['Tables']['Service']['Row']
type Employee = Database['public']['Tables']['Employee']['Row'] & {
  serviceIds: string[]
}
type Business = Database['public']['Tables']['Business']['Row']

type BookingStep = 'service' | 'datetime' | 'customer'

interface BookingPageProps {
  params: Promise<{ urlSlug: string }>
}

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  website: Globe,
  tiktok: Music2,
}

export default function BookingPage({ params: paramsPromise }: BookingPageProps) {
  const params = use(paramsPromise)
  const router = useRouter()
  const urlSlug = params.urlSlug

  // Load business data using custom hook
  const { business, businessId, serviceGroups, employees, config, loading } = useBookingData(urlSlug)

  // Booking state
  const [currentStep, setCurrentStep] = useState<BookingStep>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  
  // Use availability hook
  const { availableSlots, loadingSlots } = useAvailability({
    businessId,
    selectedService,
    selectedDate,
    selectedEmployee,
    employees
  })
  
  // Customer data
  const [customerData, setCustomerData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [marketingConsent, setMarketingConsent] = useState(true)
  
  // Booking status
  const [submitting, setSubmitting] = useState(false)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null)

  // Generate theme styles using the service
  const themeStyles = config ? BookingPageConfigService.getThemeCSSVariables(config.theme) : ''

  // Business logic helpers
  const isBusinessOpenOnDate = (date: Date): boolean => {
    if (!business || !business.businessHours) return false
    
    const dayOfWeek = date.getDay()
    const weekdayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayKey = weekdayMap[dayOfWeek]
    const businessHours = business.businessHours as any
    
    // In the database, business hours are stored as { open: string, close: string }
    // If the day exists in businessHours object, the business is open that day
    const dayHours = businessHours?.[dayKey]
    return !!dayHours && !!dayHours.open && !!dayHours.close
  }

  // Find a random available employee for the selected time slot
  const findRandomAvailableEmployee = (time: string): string | null => {
    const slot = availableSlots.find(s => s.time === time)
    if (!slot || !slot.availableEmployees || slot.availableEmployees.length === 0) {
      return null
    }
    
    const availableEmployees = slot.availableEmployees
    if (availableEmployees.length === 1) {
      return availableEmployees[0].id
    } else {
      const randomIndex = Math.floor(Math.random() * availableEmployees.length)
      return availableEmployees[randomIndex].id
    }
  }

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setSelectedEmployee(null)
    setSelectedDate(undefined)
    setSelectedTime(null)
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTime(null)
    setSelectedEmployee(null)
  }

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    
    // If no specific employee was selected, assign one randomly from available ones
    if (!selectedEmployee) {
      const randomEmployeeId = findRandomAvailableEmployee(time)
      if (randomEmployeeId) {
        const employee = employees.find(e => e.id === randomEmployeeId)
        if (employee) {
          setSelectedEmployee(employee)
        }
      }
    }
  }

  // Handle employee selection
  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
  }

  // Navigation handlers
  const handleNext = async () => {
    if (currentStep === 'service' && selectedService) {
      setCurrentStep('datetime')
    } else if (currentStep === 'datetime' && selectedDate && selectedTime && selectedEmployee) {
      setCurrentStep('customer')
    } else if (currentStep === 'customer') {
      await handleBookingSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep === 'customer') {
      setCurrentStep('datetime')
    } else if (currentStep === 'datetime') {
      setCurrentStep('service')
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return selectedService !== null
      case 'datetime':
        return selectedDate !== null && selectedTime !== null && selectedEmployee !== null
      case 'customer':
        const phoneRequired = config?.features.requirePhone ?? true
        const notesRequired = config?.content.requireNotes ?? false
        return customerData.firstName && 
               customerData.lastName && 
               customerData.email && 
               (!phoneRequired || customerData.phone) &&
               (!notesRequired || customerData.notes)
      default:
        return false
    }
  }

  // Handle booking submission
  const handleBookingSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !businessId || !selectedEmployee) return

    try {
      setSubmitting(true)

      // Create or find customer
      const customer = await CustomerService.createSimple({
        businessId: businessId,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone || ''
      })

      // Create appointment
      const appointment = await AppointmentService.createSimple({
        businessId,
        customerId: customer.id,
        employeeId: selectedEmployee.id,
        serviceId: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime,
        duration: selectedService.duration,
        bufferBefore: 0,
        bufferAfter: 0,
        price: selectedService.price,
        notes: customerData.notes || undefined,
        status: (business?.acceptAppointmentsAutomatically ? 'confirmed' : 'pending') as 'pending' | 'confirmed'
      })

      setAppointmentDetails({
        ...appointment,
        service: selectedService,
        employee: selectedEmployee,
        date: format(selectedDate, 'yyyy-MM-dd')
      })

      setBookingConfirmed(true)
      toast.success(business?.acceptAppointmentsAutomatically 
        ? config?.content.successMessage || 'Termin erfolgreich gebucht!' 
        : 'Terminanfrage gesendet!')
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Fehler bei der Buchung. Bitte versuchen Sie es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return null
  }

  return (
    <>
      {/* SEO Meta Tags */}
      {config && (
        <Head>
          <title>{config.seo.title || `${business.name} - Termin buchen`}</title>
          <meta name="description" content={config.seo.description || business.description || `Buchen Sie einen Termin bei ${business.name}`} />
          {config.seo.keywords.length > 0 && (
            <meta name="keywords" content={config.seo.keywords.join(', ')} />
          )}
          {config.faviconUrl && (
            <link rel="icon" href={config.faviconUrl} />
          )}
        </Head>
      )}
      
      <div className="min-h-screen" style={{
        backgroundColor: config?.theme.backgroundColor || '#ffffff',
        color: config?.theme.textColor || '#1f2937',
        fontFamily: config?.theme.fontFamily ? `${config.theme.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` : undefined,
      }}>
        {/* Theme Styles */}
        {config && (
          <>
            <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
            {config.customCSS && <style dangerouslySetInnerHTML={{ __html: config.customCSS }} />}
          </>
        )}
        
        <BookingPageHeader business={business} config={config} />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <StepIndicator 
          currentStep={currentStep} 
          bookingConfirmed={bookingConfirmed} 
          config={config} 
        />

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {/* Service Selection */}
            {!bookingConfirmed && currentStep === 'service' && (
              <ServiceSelector
                serviceGroups={serviceGroups}
                selectedService={selectedService}
                config={config}
                onServiceSelect={handleServiceSelect}
              />
            )}

            {/* Date & Time Selection */}
            {!bookingConfirmed && currentStep === 'datetime' && selectedService && (
              <>
                <DateTimePicker
                  selectedService={selectedService}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  selectedEmployee={selectedEmployee}
                  availableSlots={availableSlots}
                  loadingSlots={loadingSlots}
                  config={config}
                  weekOffset={weekOffset}
                  onDateSelect={handleDateSelect}
                  onTimeSelect={handleTimeSelect}
                  onWeekOffsetChange={setWeekOffset}
                  isBusinessOpenOnDate={isBusinessOpenOnDate}
                />
                
                <EmployeeSelector
                  employees={employees}
                  selectedEmployee={selectedEmployee}
                  selectedTime={selectedTime}
                  availableSlots={availableSlots}
                  showEmployeeSelection={config?.layout.showEmployeeSelection}
                  onEmployeeSelect={handleEmployeeSelect}
                />
              </>
            )}

            {/* Customer Form */}
            {!bookingConfirmed && currentStep === 'customer' && (
              <CustomerForm
                customerData={customerData}
                marketingConsent={marketingConsent}
                config={config}
                onCustomerDataChange={setCustomerData}
                onMarketingConsentChange={setMarketingConsent}
              />
            )}

            {/* Confirmation */}
            {bookingConfirmed && appointmentDetails && (
              <BookingConfirmation
                business={business}
                config={config}
                appointmentDetails={appointmentDetails}
                selectedTime={selectedTime || ''}
                onNewBooking={() => {
                  // Reset all state
                  setCurrentStep('service')
                  setSelectedService(null)
                  setSelectedEmployee(null)
                  setSelectedDate(undefined)
                  setSelectedTime(null)
                  setBookingConfirmed(false)
                  setAppointmentDetails(null)
                  setCustomerData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    notes: ''
                  })
                }}
              />
            )}

            {/* Navigation Buttons */}
            {!bookingConfirmed && (
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 'service'}
                  style={{ borderColor: config?.theme.secondaryColor }}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || submitting}
                  style={{ backgroundColor: config?.theme.primaryColor }}
                >
                  {currentStep === 'customer' ? (
                    submitting ? 'Wird gesendet...' : 'Termin buchen'
                  ) : (
                    <>
                      Weiter
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Contact Info */}
        <div className="mt-12 pt-8 border-t" style={{ borderColor: config?.theme.secondaryColor }}>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-6">
            {business.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{business.address}</span>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>{business.phone}</span>
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{business.email}</span>
              </div>
            )}
          </div>

          {/* Social Links */}
          {config?.content.showSocialLinks && Object.keys(config.content.socialLinks).length > 0 && (
            <div className="flex justify-center gap-4">
              {Object.entries(config.content.socialLinks).map(([platform, url]) => {
                const Icon = socialIcons[platform as keyof typeof socialIcons] || Globe
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: config?.theme.secondaryColor }}
                  >
                    <Icon className="h-6 w-6" />
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}