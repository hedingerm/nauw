'use client'

import { useState, useEffect, use } from 'react'
import Head from 'next/head'
import { useParams, useRouter } from 'next/navigation'
import { BusinessService } from '@/src/lib/services/business.service'
import { ServiceService, type ServicesGroupedByCategory } from '@/src/lib/services/service.service'
import { EmployeeService } from '@/src/lib/services/employee.service'
import { CustomerService } from '@/src/lib/services/customer.service'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import { AvailabilityService } from '@/src/lib/services/availability.service'
import { BookingPageConfigService } from '@/src/lib/services/booking-config.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Calendar } from '@/src/components/ui/calendar'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Checkbox } from '@/src/components/ui/checkbox'
import { toast } from 'sonner'
import { format, addDays, isSameDay, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Clock, MapPin, Phone, Mail, Euro, ChevronLeft, ChevronRight, Check, Tag, Layers, ChevronDown, ChevronUp, Facebook, Instagram, Twitter, Linkedin, Youtube, Globe, Music2 } from 'lucide-react'
import type { Database } from '@/src/lib/supabase/database.types'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'
import { formatPhoneInput, getSwissPhonePlaceholder } from '@/src/lib/utils/normalize'
import { cn } from '@/src/lib/utils/cn'

type Business = Database['public']['Tables']['Business']['Row']
type Service = Database['public']['Tables']['Service']['Row']
type Employee = Database['public']['Tables']['Employee']['Row'] & {
  serviceIds: string[]
}

interface TimeSlot {
  time: string
  available: boolean
  employeeId?: string
  employeeName?: string
  availableEmployeeCount?: number
  availableEmployees?: Array<{ id: string; name: string }> // Track all available employees
}

interface CustomerFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  notes: string
}

type BookingStep = 'service' | 'datetime' | 'customer' | 'confirmation'

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

  // Business data
  const [business, setBusiness] = useState<Business | null>(null)
  const [config, setConfig] = useState<BookingPageConfig | null>(null)
  const [serviceGroups, setServiceGroups] = useState<ServicesGroupedByCategory[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)

  // Booking state
  const [currentStep, setCurrentStep] = useState<BookingStep>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  // Category collapse state - auto expand based on config
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  // Customer data
  const [customerData, setCustomerData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  })
  
  // Week navigation state
  const [weekOffset, setWeekOffset] = useState(0)
  const [marketingConsent, setMarketingConsent] = useState(true)

  // Booking submission
  const [submitting, setSubmitting] = useState(false)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null)

  useEffect(() => {
    loadBusinessData()
  }, [urlSlug])

  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedService, selectedDate]) // Removed selectedEmployee - we don't need to reload when employee changes

  // Auto-expand categories based on config
  useEffect(() => {
    if (config?.layout.showCategories && config?.layout.categoriesExpanded && serviceGroups.length > 0) {
      const allCategories = new Set(serviceGroups.map(group => group.category?.id || 'uncategorized'))
      setExpandedCategories(allCategories)
    }
  }, [config, serviceGroups])

  const loadBusinessData = async () => {
    try {
      setLoading(true)
      
      // Load business details by URL slug
      const businessData = await BusinessService.getBySlug(urlSlug)
      if (!businessData) {
        toast.error('Unternehmen nicht gefunden')
        router.push('/')
        return
      }
      setBusiness(businessData)
      setBusinessId(businessData.id)

      // Load services, employees, and config in parallel
      const [serviceGroupsData, employeesData, configData] = await Promise.all([
        ServiceService.listActiveGroupedByCategory(businessData.id),
        EmployeeService.listActive(businessData.id),
        BookingPageConfigService.getOrCreate(businessData.id)
      ])
      
      setServiceGroups(serviceGroupsData)
      setEmployees(employeesData)
      setConfig(configData)
    } catch (error) {
      console.error('Error loading business data:', error)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to check if business is open on a specific date
  const isBusinessOpenOnDate = (date: Date): boolean => {
    if (!business) return false
    
    const dayOfWeek = date.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek] as keyof typeof business.businessHours
    
    const businessHoursForDay = business.businessHours?.[dayName] as { open: string; close: string } | undefined
    
    // Business is closed if no hours are defined for this day
    return !!businessHoursForDay
  }

  // Helper function to get fair employee distribution
  const selectEmployeeFairly = async (availableEmployees: Array<{id: string, name: string}>, date: string): Promise<string> => {
    try {
      // Get existing appointments for this date to see current distribution
      if (!businessId) return availableEmployees[0]?.id || ''
      const appointments = await AppointmentService.getByDateAndEmployee(businessId, date)
      
      // Count appointments per employee
      const appointmentCounts = new Map<string, number>()
      availableEmployees.forEach(emp => appointmentCounts.set(emp.id, 0))
      
      appointments.forEach(apt => {
        if (appointmentCounts.has(apt.employeeId)) {
          appointmentCounts.set(apt.employeeId, (appointmentCounts.get(apt.employeeId) || 0) + 1)
        }
      })
      
      // Find employee(s) with least appointments
      let minCount = Infinity
      const leastBusyEmployees: string[] = []
      
      appointmentCounts.forEach((count, empId) => {
        if (count < minCount) {
          minCount = count
          leastBusyEmployees.length = 0
          leastBusyEmployees.push(empId)
        } else if (count === minCount) {
          leastBusyEmployees.push(empId)
        }
      })
      
      // Randomly select from the least busy employees
      const randomIndex = Math.floor(Math.random() * leastBusyEmployees.length)
      return leastBusyEmployees[randomIndex]
      
    } catch (error) {
      console.error('Error getting fair distribution:', error)
      // Fallback to random selection
      const randomIndex = Math.floor(Math.random() * availableEmployees.length)
      return availableEmployees[randomIndex].id
    }
  }

  const loadAvailableSlots = async () => {
    if (!selectedService || !selectedDate || !businessId) return

    try {
      setLoadingSlots(true)
      
      // If employee is selected, get slots for that employee only
      // Otherwise, get slots for all employees who can provide this service
      if (selectedEmployee) {
        const slots = await AvailabilityService.getAvailableSlotsSimple({
          businessId,
          employeeId: selectedEmployee.id,
          serviceId: selectedService.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          duration: selectedService.duration
        })
        
        setAvailableSlots(slots.map(slot => ({
          time: slot.startTime,
          available: slot.available,
          employeeId: selectedEmployee.id,
          employeeName: selectedEmployee.name,
          availableEmployeeCount: 1 // When specific employee is selected, count is 1
        })))
      } else {
        // Get all available employees for this service
        const availableEmployees = employees.filter(emp => 
          emp.serviceIds.includes(selectedService.id)
        )
        
        // Fetch slots for all employees
        const allSlots: TimeSlot[] = []
        for (const employee of availableEmployees) {
          const slots = await AvailabilityService.getAvailableSlotsSimple({
            businessId,
            employeeId: employee.id,
            serviceId: selectedService.id,
            date: format(selectedDate, 'yyyy-MM-dd'),
            duration: selectedService.duration
          })
          
          // Add employee info to each slot
          const employeeSlots = slots.map(slot => ({
            time: slot.startTime,
            available: slot.available,
            employeeId: employee.id,
            employeeName: employee.name
          }))
          
          allSlots.push(...employeeSlots)
        }
        
        // Group slots by time and merge availability
        const slotMap = new Map<string, TimeSlot[]>()
        allSlots.forEach(slot => {
          const existing = slotMap.get(slot.time) || []
          existing.push(slot)
          slotMap.set(slot.time, existing)
        })
        
        // Get fair employee selection for each time slot
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        
        // Create merged slots with employee count
        const mergedSlots: TimeSlot[] = []
        for (const [time, slots] of slotMap.entries()) {
          const availableSlots = slots.filter(s => s.available)
          if (availableSlots.length > 0) {
            // Collect all available employees for this time
            const availableEmployeesList = availableSlots.map(s => ({
              id: s.employeeId!,
              name: s.employeeName!
            }))
            
            // Select employee fairly based on current workload
            const fairlySelectedId = await selectEmployeeFairly(availableEmployeesList, dateStr)
            const defaultSlot = availableSlots.find(s => s.employeeId === fairlySelectedId) || availableSlots[0]
            
            mergedSlots.push({
              time,
              available: true,
              employeeId: defaultSlot.employeeId,
              employeeName: defaultSlot.employeeName,
              availableEmployeeCount: availableSlots.length,
              availableEmployees: availableEmployeesList
            })
            console.log(`Time ${time}: ${availableSlots.length} employees available, fairly selected: ${defaultSlot.employeeName}`)
          } else {
            mergedSlots.push({
              time,
              available: false
            })
          }
        }
        
        // Sort by time
        mergedSlots.sort((a, b) => {
          const timeA = parseInt(a.time.replace(':', ''))
          const timeB = parseInt(b.time.replace(':', ''))
          return timeA - timeB
        })
        
        // Group slots by interval if configured
        const interval = config?.layout.timeSlotInterval
        if (interval && interval > 15) {
          const groupedSlots: TimeSlot[] = []
          const processedTimes = new Set<string>()
          
          mergedSlots.forEach(slot => {
            if (processedTimes.has(slot.time)) return
            
            const [hours, minutes] = slot.time.split(':').map(Number)
            const totalMinutes = hours * 60 + minutes
            
            // Only include slots that align with the interval
            if (totalMinutes % interval === 0) {
              groupedSlots.push(slot)
              processedTimes.add(slot.time)
            }
          })
          
          setAvailableSlots(groupedSlots)
        } else {
          setAvailableSlots(mergedSlots)
        }
      }
    } catch (error) {
      console.error('Error loading available slots:', error)
      toast.error('Fehler beim Laden der verfügbaren Zeiten')
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    // Don't auto-select employee anymore - let user pick time slot first
    setSelectedEmployee(null)
    setSelectedTime(null)
    setAvailableSlots([])
    setWeekOffset(0) // Reset week navigation
    setCurrentStep('datetime')
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTime(null) // Reset time when date changes
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    
    // Find the slot and auto-select the employee
    const slot = availableSlots.find(s => s.time === time && s.available)
    if (slot && slot.employeeId) {
      const employee = employees.find(e => e.id === slot.employeeId)
      if (employee) {
        setSelectedEmployee(employee)
      }
    }
  }
  
  // Get all available employees for the selected time slot
  const getAvailableEmployeesForTime = (time: string) => {
    if (!selectedService || !selectedDate || !time) return []
    
    // When we have loaded all employees' slots, we need to check original data
    const availableEmployees = employees.filter(emp => {
      if (!emp.serviceIds.includes(selectedService.id)) return false
      
      // This is a simplified check - in production you'd want to 
      // check against the actual availability data
      return true
    })
    
    return availableEmployees
  }

  const handleCustomerSubmit = async () => {
    if (!selectedService || !selectedEmployee || !selectedDate || !selectedTime) {
      toast.error('Bitte wählen Sie alle erforderlichen Optionen aus')
      return
    }

    try {
      setSubmitting(true)

      // Create or find customer using getOrCreate to prevent duplicates
      if (!businessId) {
        throw new Error('Business ID not available')
      }
      
      const customer = await CustomerService.getOrCreate(businessId, {
        name: `${customerData.firstName} ${customerData.lastName}`,
        email: customerData.email,
        phone: customerData.phone,
        preferredContactMethod: 'email',
        marketingConsent: marketingConsent
      })

      // Create appointment
      const appointmentData = {
        businessId,
        customerId: customer.id,
        employeeId: selectedEmployee.id,
        serviceId: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime,
        duration: selectedService.duration,
        bufferBefore: selectedService.bufferBefore,
        bufferAfter: selectedService.bufferAfter,
        price: selectedService.price,
        notes: customerData.notes || undefined,
        status: (business?.acceptAppointmentsAutomatically ? 'confirmed' : 'pending') as 'pending' | 'confirmed'
      }

      const appointment = await AppointmentService.createSimple(appointmentData)
      
      setAppointmentDetails({
        ...appointment,
        date: format(selectedDate, 'yyyy-MM-dd'),
        service: selectedService,
        employee: selectedEmployee
      })
      
      setBookingConfirmed(true)
      setCurrentStep('confirmation')
      
      toast.success(
        business?.acceptAppointmentsAutomatically 
          ? 'Termin erfolgreich gebucht!' 
          : 'Terminanfrage erfolgreich gesendet!'
      )
    } catch (error: any) {
      console.error('Error submitting booking:', error)
      toast.error(error.message || 'Fehler beim Buchen des Termins')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'datetime':
        setCurrentStep('service')
        break
      case 'customer':
        setCurrentStep('datetime')
        break
      case 'confirmation':
        // Can't go back from confirmation
        break
    }
  }

  const handleNext = () => {
    switch (currentStep) {
      case 'service':
        if (selectedService) {
          setCurrentStep('datetime')
        }
        break
      case 'datetime':
        if (selectedEmployee && selectedDate && selectedTime) {
          setCurrentStep('customer')
        }
        break
      case 'customer':
        handleCustomerSubmit()
        break
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return selectedService !== null
      case 'datetime':
        return selectedDate !== undefined && selectedTime !== null && selectedEmployee !== null
      case 'customer':
        const phoneRequired = config?.features.requirePhone ?? true // Default to true if config not loaded
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!business) {
    return null
  }

  // Apply theme CSS variables
  const themeStyles = config ? BookingPageConfigService.getThemeCSSVariables(config.theme) : ''

  return (
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
      
      {/* Header with Cover Image and Logo */}
      {(config?.logoUrl || config?.coverImageUrl) && (
        <div className="relative mb-8">
          {/* Cover Image */}
          {config.coverImageUrl && (
            <div className="h-48 md:h-64 bg-cover bg-center relative" style={{ backgroundImage: `url(${config.coverImageUrl})` }}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
            </div>
          )}
          
          {/* Logo - Centered and visible over cover */}
          {config.logoUrl && (
            <div className={cn(
              "flex justify-center",
              config.coverImageUrl ? "absolute inset-0 items-center" : "py-8"
            )}>
              <div className={cn(
                "p-4 rounded-lg",
                config.coverImageUrl ? "bg-white/90 backdrop-blur-sm shadow-lg" : ""
              )}>
                <img 
                  src={config.logoUrl} 
                  alt={business.name} 
                  className="h-20 md:h-24 object-contain max-w-[200px]"
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Business Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: config?.theme.primaryColor }}>{config?.content.welcomeTitle || business.name}</h1>
        {config?.content.welcomeText ? (
          <p className="text-lg opacity-80 mb-4">{config.content.welcomeText}</p>
        ) : business.description && (
          <p className="text-muted-foreground mb-4">{business.description}</p>
        )}
      </div>

      {/* Progress Steps */}
      <div className="mb-8 px-4">
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          {/* Step 1: Service */}
          <div className="flex items-center">
            <div 
              className="rounded-full h-8 w-8 flex items-center justify-center border-2 transition-all duration-300"
              style={{
                borderColor: ['service', 'datetime', 'customer', 'confirmation'].includes(currentStep) || bookingConfirmed ? config?.theme.primaryColor : '#e5e7eb',
                backgroundColor: ['service', 'datetime', 'customer', 'confirmation'].includes(currentStep) || bookingConfirmed ? config?.theme.primaryColor : 'transparent',
                color: ['service', 'datetime', 'customer', 'confirmation'].includes(currentStep) || bookingConfirmed ? 'white' : currentStep === 'service' ? config?.theme.primaryColor : '#9ca3af'
              }}
            >
              {bookingConfirmed || ['datetime', 'customer', 'confirmation'].includes(currentStep) ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <span className="ml-2 hidden sm:inline font-medium" style={{ 
              color: currentStep === 'service' ? config?.theme.primaryColor : '#6b7280' 
            }}>Service</span>
          </div>
          
          <div className="flex-1 h-0.5 max-w-[4rem]" style={{ 
            backgroundColor: ['datetime', 'customer', 'confirmation'].includes(currentStep) || bookingConfirmed ? config?.theme.primaryColor : '#e5e7eb' 
          }} />
          
          {/* Step 2: DateTime */}
          <div className="flex items-center">
            <div 
              className="rounded-full h-8 w-8 flex items-center justify-center border-2 transition-all duration-300"
              style={{
                borderColor: ['datetime', 'customer', 'confirmation'].includes(currentStep) || bookingConfirmed ? config?.theme.primaryColor : currentStep === 'datetime' ? config?.theme.primaryColor : '#e5e7eb',
                backgroundColor: ['datetime', 'customer', 'confirmation'].includes(currentStep) || bookingConfirmed ? config?.theme.primaryColor : 'transparent',
                color: ['datetime', 'customer', 'confirmation'].includes(currentStep) || bookingConfirmed ? 'white' : currentStep === 'datetime' ? config?.theme.primaryColor : '#9ca3af'
              }}
            >
              {bookingConfirmed || ['customer', 'confirmation'].includes(currentStep) ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <span className="ml-2 hidden sm:inline font-medium" style={{ 
              color: currentStep === 'datetime' ? config?.theme.primaryColor : '#6b7280' 
            }}>Termin</span>
          </div>
          
          <div className="flex-1 h-0.5 max-w-[4rem]" style={{ 
            backgroundColor: ['customer', 'confirmation'].includes(currentStep) || bookingConfirmed ? config?.theme.primaryColor : '#e5e7eb' 
          }} />
          
          {/* Step 3: Customer */}
          <div className="flex items-center">
            <div 
              className="rounded-full h-8 w-8 flex items-center justify-center border-2 transition-all duration-300"
              style={{
                borderColor: ['customer', 'confirmation'].includes(currentStep) || bookingConfirmed ? config?.theme.primaryColor : currentStep === 'customer' ? config?.theme.primaryColor : '#e5e7eb',
                backgroundColor: ['customer', 'confirmation'].includes(currentStep) || bookingConfirmed ? config?.theme.primaryColor : 'transparent',
                color: ['customer', 'confirmation'].includes(currentStep) || bookingConfirmed ? 'white' : currentStep === 'customer' ? config?.theme.primaryColor : '#9ca3af'
              }}
            >
              {bookingConfirmed || currentStep === 'confirmation' ? <Check className="h-4 w-4" /> : '3'}
            </div>
            <span className="ml-2 hidden sm:inline font-medium" style={{ 
              color: currentStep === 'customer' ? config?.theme.primaryColor : '#6b7280' 
            }}>Kontakt</span>
          </div>
          
          <div className="flex-1 h-0.5 max-w-[4rem]" style={{ 
            backgroundColor: currentStep === 'confirmation' || bookingConfirmed ? config?.theme.primaryColor : '#e5e7eb' 
          }} />
          
          {/* Step 4: Confirmation */}
          <div className="flex items-center">
            <div 
              className="rounded-full h-8 w-8 flex items-center justify-center border-2 transition-all duration-300"
              style={{
                borderColor: currentStep === 'confirmation' || bookingConfirmed ? config?.theme.primaryColor : '#e5e7eb',
                backgroundColor: currentStep === 'confirmation' || bookingConfirmed ? config?.theme.primaryColor : 'transparent',
                color: currentStep === 'confirmation' || bookingConfirmed ? 'white' : '#9ca3af'
              }}
            >
              {currentStep === 'confirmation' || bookingConfirmed ? <Check className="h-4 w-4" /> : '4'}
            </div>
            <span className="ml-2 hidden sm:inline font-medium" style={{ 
              color: currentStep === 'confirmation' ? config?.theme.primaryColor : '#6b7280' 
            }}>Bestätigung</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Service Selection */}
          {currentStep === 'service' && (
            <div>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Service auswählen</CardTitle>
                <CardDescription>Wählen Sie die gewünschte Dienstleistung aus</CardDescription>
              </CardHeader>
              
              <div className="space-y-4 mt-6">
                {serviceGroups.map((group) => {
                  const categoryId = group.category?.id || 'uncategorized'
                  const isExpanded = expandedCategories.has(categoryId)
                  const serviceCount = group.services.length
                  const showCategories = config?.layout.showCategories ?? true // Default to showing categories
                  
                  return (
                    <div key={categoryId} className={showCategories ? "border rounded-lg overflow-hidden" : ""}>
                      {/* Category Header - Clickable */}
                      {showCategories && (
                        <button
                          onClick={() => toggleCategory(categoryId)}
                          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {group.category ? (
                              <>
                                <Tag className="h-5 w-5 text-muted-foreground" />
                                <h3 className="text-lg font-semibold">{group.category.name}</h3>
                                {group.category.description && (
                                  <span className="text-sm text-muted-foreground">– {group.category.description}</span>
                                )}
                              </>
                            ) : (
                              <>
                                <Layers className="h-5 w-5 text-muted-foreground" />
                                <h3 className="text-lg font-semibold">Weitere Services</h3>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-normal">
                              {serviceCount} {serviceCount === 1 ? 'Service' : 'Services'}
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </button>
                      )}
                      
                      {/* Services Grid - Always visible if categories are hidden */}
                      <div className={showCategories ? `transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}` : ''}>
                        <div className={cn(
                          "p-4 gap-4",
                          config?.layout.serviceLayout === 'grid' ? 'grid md:grid-cols-2' : 'space-y-3'
                        )}>
                          {group.services.map((service) => (
                            <Card 
                              key={service.id} 
                              className={cn(
                                "cursor-pointer transition-all hover:shadow-md",
                                selectedService?.id === service.id ? 'ring-2 ring-primary' : '',
                                config?.layout.serviceLayout === 'list' ? 'flex items-center' : ''
                              )}
                              onClick={() => handleServiceSelect(service)}
                              style={{
                                borderColor: config?.theme.secondaryColor,
                                borderRadius: `var(--radius)`,
                              }}
                            >
                              <CardContent className={cn(
                                "p-4",
                                config?.layout.serviceLayout === 'list' ? 'flex-1 flex items-center justify-between' : ''
                              )}>
                                <div className={config?.layout.serviceLayout === 'list' ? 'flex-1' : ''}>
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold">{service.name}</h3>
                                    {config?.layout.serviceLayout === 'grid' && config?.features.showPrices && (
                                      <Badge variant="secondary" style={{ backgroundColor: config?.theme.accentColor, color: 'white' }}>
                                        CHF {service.price.toFixed(2)}
                                      </Badge>
                                    )}
                                  </div>
                                  {service.description && (
                                    <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                                  )}
                                  {config?.features.showDuration && (
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{service.duration} Min.</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {config?.layout.serviceLayout === 'list' && config?.features.showPrices && (
                                  <Badge variant="secondary" style={{ backgroundColor: config?.theme.accentColor, color: 'white' }}>
                                    CHF {service.price.toFixed(2)}
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Date & Time Selection */}
          {currentStep === 'datetime' && selectedService && (
            <div>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Termin auswählen</CardTitle>
                <CardDescription>
                  Wählen Sie Ihren Wunschtermin für: {selectedService.name}
                </CardDescription>
              </CardHeader>

              {/* Date and Time Selection - Show immediately */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Datum auswählen</Label>
                  
                  {/* Calendar View Based on Config */}
                  {config?.layout.calendarView === 'list' ? (
                    // List View - Show only available dates
                    <div className="mt-2 space-y-2 max-h-96 overflow-y-auto border rounded-md p-4">
                      {(() => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const maxDays = config?.layout.maxAdvanceBookingDays || 60
                        const availableDates = []
                        
                        for (let i = 0; i <= maxDays; i++) {
                          const date = addDays(today, i)
                          if (isBusinessOpenOnDate(date)) {
                            availableDates.push(date)
                          }
                        }
                        
                        if (availableDates.length === 0) {
                          return <p className="text-muted-foreground">Keine verfügbaren Termine</p>
                        }
                        
                        return availableDates.slice(0, 20).map((date) => (
                          <Button
                            key={date.toISOString()}
                            variant={selectedDate && isSameDay(selectedDate, date) ? 'default' : 'outline'}
                            className="w-full justify-start"
                            onClick={() => handleDateSelect(date)}
                            style={selectedDate && isSameDay(selectedDate, date) ? {
                              backgroundColor: config?.theme.primaryColor,
                              borderColor: config?.theme.primaryColor
                            } : {}}
                          >
                            {format(date, 'EEEE, d. MMMM yyyy', { locale: de })}
                          </Button>
                        ))
                      })()}
                    </div>
                  ) : config?.layout.calendarView === 'week' ? (
                    // Week View - Show 7 days at a time with navigation
                    <div className="mt-2 border rounded-md p-4">
                      {(() => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const baseStartOfWeek = new Date(today)
                        baseStartOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
                        const startOfWeek = addDays(baseStartOfWeek, weekOffset * 7)
                        const maxDays = config?.layout.maxAdvanceBookingDays || 60
                        
                        return (
                          <>
                            {/* Week Navigation Header */}
                            <div className="flex items-center justify-between mb-4">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setWeekOffset(weekOffset - 1)}
                                disabled={weekOffset <= 0}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              
                              <div className="text-center">
                                <p className="font-medium">
                                  {format(startOfWeek, 'MMMM yyyy', { locale: de })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(startOfWeek, 'd.')} - {format(addDays(startOfWeek, 6), 'd. MMMM', { locale: de })}
                                </p>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setWeekOffset(weekOffset + 1)}
                                disabled={addDays(startOfWeek, 7) > addDays(today, maxDays)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Week Days Grid */}
                            <div className="grid grid-cols-7 gap-1">
                              {Array.from({ length: 7 }, (_, i) => {
                                const date = addDays(startOfWeek, i)
                                const isDisabled = date < today || 
                                                 date > addDays(today, maxDays) || 
                                                 !isBusinessOpenOnDate(date)
                                const isToday = isSameDay(date, today)
                                
                                return (
                                  <Button
                                    key={date.toISOString()}
                                    variant={selectedDate && isSameDay(selectedDate, date) ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={isDisabled}
                                    onClick={() => !isDisabled && handleDateSelect(date)}
                                    className={cn(
                                      "flex flex-col items-center p-2 h-auto",
                                      isToday && "ring-2 ring-primary ring-offset-2"
                                    )}
                                    style={selectedDate && isSameDay(selectedDate, date) ? {
                                      backgroundColor: config?.theme.primaryColor,
                                      borderColor: config?.theme.primaryColor
                                    } : {}}
                                  >
                                    <span className="text-xs">{format(date, 'EEE', { locale: de })}</span>
                                    <span className="text-lg font-semibold">{format(date, 'd')}</span>
                                    {isToday && <span className="text-xs">Heute</span>}
                                  </Button>
                                )
                              })}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    // Month View (default)
                    <div>
                      <style dangerouslySetInnerHTML={{ __html: `
                        .calendar-custom [data-selected-single="true"] {
                          background-color: ${config?.theme.primaryColor || '#2563eb'} !important;
                          color: white !important;
                          font-weight: 600;
                          border: 2px solid ${config?.theme.primaryColor || '#2563eb'} !important;
                        }
                        .calendar-custom [data-selected-single="true"]:hover {
                          background-color: ${config?.theme.primaryColor || '#2563eb'} !important;
                          opacity: 0.9;
                        }
                        .calendar-custom .rdp-today {
                          font-weight: 700;
                          color: ${config?.theme.primaryColor || '#2563eb'};
                        }
                      `}} />
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => {
                          // Disable past dates
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          if (date < today) return true
                          
                          // Disable dates beyond max advance booking days
                          const maxDays = config?.layout.maxAdvanceBookingDays || 60
                          if (date > addDays(today, maxDays)) return true
                          
                          // Disable dates when business is closed
                          return !isBusinessOpenOnDate(date)
                        }}
                        locale={de}
                        className="rounded-md border mt-2 calendar-custom"
                      />
                    </div>
                  )}
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <Label>Zeit auswählen</Label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="space-y-4">
                        {/* Show info about multiple employees if any slot has more than 1 */}
                        {availableSlots.some(s => s.availableEmployeeCount && s.availableEmployeeCount > 1) && (
                          <p className="text-sm text-muted-foreground">
                            Die Zahl zeigt an, wie viele Mitarbeiter zu dieser Zeit verfügbar sind.
                          </p>
                        )}
                        <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                          {availableSlots.map((slot) => (
                            <div key={`${slot.time}-${slot.employeeId || 'any'}`} className="relative">
                              <Button
                                variant={selectedTime === slot.time ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleTimeSelect(slot.time)}
                                disabled={!slot.available}
                                className="w-full relative overflow-visible"
                                style={selectedTime === slot.time ? { 
                                  backgroundColor: config?.theme.primaryColor,
                                  borderColor: config?.theme.primaryColor 
                                } : {
                                  borderColor: config?.theme.secondaryColor
                                }}
                              >
                                {slot.time}
                                {slot.available && slot.availableEmployeeCount && slot.availableEmployeeCount > 1 && (
                                  <span 
                                    className="absolute -top-2 -right-2 text-white text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-sm"
                                    style={{ backgroundColor: config?.theme.accentColor || '#f59e0b' }}
                                  >
                                    {slot.availableEmployeeCount}
                                  </span>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Selected Time Info */}
                        {selectedTime && selectedEmployee && (
                          <div className="mt-8 p-3 bg-muted rounded-lg">
                            <p className="text-sm">
                              <strong>Ausgewählter Termin:</strong> {selectedTime} Uhr mit {selectedEmployee.name}
                            </p>
                            {(() => {
                              const slot = availableSlots.find(s => s.time === selectedTime)
                              return slot && slot.availableEmployeeCount && slot.availableEmployeeCount > 1 ? (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Automatisch zugewiesen für gleichmäßige Auslastung
                                </p>
                              ) : null
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-4">
                        Keine verfügbaren Zeiten für dieses Datum
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Optional Employee Selection - After time slot is selected */}
              {selectedTime && config?.layout.showEmployeeSelection && (() => {
                const selectedSlot = availableSlots.find(s => s.time === selectedTime && s.available)
                const availableEmps = selectedSlot?.availableEmployees || []
                
                return availableEmps.length > 1 ? (
                  <div className="mt-6 pt-6 border-t">
                    <Label>Mitarbeiter auswählen</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      {availableEmps.length} Mitarbeiter sind um {selectedTime} Uhr verfügbar
                    </p>
                    <div className="grid gap-3">
                      {availableEmps.map((emp) => {
                        const employee = employees.find(e => e.id === emp.id)
                        if (!employee) return null
                        
                        return (
                          <Card 
                            key={employee.id} 
                            className={`cursor-pointer transition-all ${
                              selectedEmployee?.id === employee.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => handleEmployeeSelect(employee)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{employee.name}</span>
                                {selectedEmployee?.id === employee.id && (
                                  <Check className="h-5 w-5 text-primary" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          )}

          {/* Customer Information */}
          {currentStep === 'customer' && (
            <div>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Ihre Kontaktdaten</CardTitle>
                <CardDescription>
                  Bitte geben Sie Ihre Kontaktinformationen ein
                </CardDescription>
              </CardHeader>

              <div className="space-y-4 mt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname *</Label>
                    <Input
                      id="firstName"
                      value={customerData.firstName}
                      onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })}
                      placeholder="Max"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname *</Label>
                    <Input
                      id="lastName"
                      value={customerData.lastName}
                      onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })}
                      placeholder="Mustermann"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    placeholder="max@example.com"
                    required
                  />
                </div>

                {config?.features.requirePhone && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefonnummer *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerData.phone}
                      onChange={(e) => {
                        const formatted = formatPhoneInput(e.target.value)
                        setCustomerData({ ...customerData, phone: formatted })
                      }}
                      placeholder={getSwissPhonePlaceholder()}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Sie können die Nummer in jedem Format eingeben: 079 123 45 67, 0791234567, +41791234567
                    </p>
                  </div>
                )}

                {config?.features.allowCustomerNotes && (
                  <div className="space-y-2">
                    <Label htmlFor="notes">{config?.content.notesLabel || 'Anmerkungen'} {config?.content.requireNotes ? '*' : '(optional)'}</Label>
                    <Textarea
                      id="notes"
                      value={customerData.notes}
                      onChange={(e) => setCustomerData({ ...customerData, notes: e.target.value })}
                      placeholder={config?.content.notesLabel || "Besondere Wünsche oder Anmerkungen..."}
                      rows={3}
                      required={config?.content.requireNotes}
                    />
                  </div>
                )}

                {config?.features.showMarketingConsent && (
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="marketing"
                      checked={marketingConsent}
                      onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                      className="border-gray-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
                      style={{
                        ...(marketingConsent && {
                          backgroundColor: config?.theme.primaryColor || '#2563eb',
                          borderColor: config?.theme.primaryColor || '#2563eb',
                        })
                      }}
                    />
                    <Label htmlFor="marketing" className="text-sm cursor-pointer">
                      Ich möchte über Neuigkeiten und Angebote informiert werden
                    </Label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirmation */}
          {currentStep === 'confirmation' && bookingConfirmed && appointmentDetails && (
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mitarbeiter:</span>
                      <span className="font-medium">{appointmentDetails.employee.name}</span>
                    </div>
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
                onClick={() => router.push('/')} 
                className="mt-6"
                size="lg"
                style={{ backgroundColor: config?.theme.primaryColor }}
              >
                Neue Buchung
              </Button>
            </div>
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
  )
}