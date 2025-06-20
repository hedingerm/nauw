'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { combineDateTimeToUTC } from '@/src/lib/utils/timezone'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
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
import { Button } from '@/src/components/ui/button'
import { Textarea } from '@/src/components/ui/textarea'
import { ServiceService } from '@/src/lib/services/service.service'
import { EmployeeService } from '@/src/lib/services/employee.service'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import { CustomerService } from '@/src/lib/services/customer.service'
import { AvailabilityService } from '@/src/lib/services/availability.service'
import { createAppointmentSchema, type CreateAppointmentInput } from '@/src/lib/schemas/appointment'
import { CustomerSearch } from './customer-search'
import { TimeSlotPicker } from './time-slot-picker'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface AppointmentCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  initialDate?: Date
  initialTime?: string
  initialEmployeeId?: string
  onSuccess: () => void
}

export function AppointmentCreateDialog({
  open,
  onOpenChange,
  businessId,
  initialDate,
  initialTime,
  initialEmployeeId,
  onSuccess,
}: AppointmentCreateDialogProps) {
  const [services, setServices] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  const form = useForm<CreateAppointmentInput>({
    resolver: zodResolver(createAppointmentSchema) as any,
    defaultValues: {
      serviceId: '',
      employeeId: initialEmployeeId || '',
      startTime: '',
      notes: '',
      status: 'confirmed' as const,
      customerId: undefined,
      customerData: undefined,
    },
  })

  const selectedService = form.watch('serviceId')
  const selectedEmployee = form.watch('employeeId')
  
  // Use useMemo to prevent creating new Date on every render
  const selectedDate = React.useMemo(() => {
    return initialDate || new Date()
  }, [initialDate])

  const loadData = async () => {
    try {
      // Load services
      const servicesData = await ServiceService.list(businessId)
      setServices(servicesData.filter(s => s.isActive))

      // Load all employees (we'll filter them based on service selection)
      const employeesData = await EmployeeService.list(businessId)
      setEmployees(employeesData.filter(e => e.isActive && e.canPerformServices))
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Fehler beim Laden der Daten')
    }
  }

  const loadEmployeesForService = async (serviceId: string) => {
    try {
      // Get employees who can perform this service
      const employeesForService = await EmployeeService.getByService(serviceId)
      // Filter to only show active employees who can perform services
      const activeEmployees = employeesForService.filter(e => e.isActive && e.canPerformServices)
      setFilteredEmployees(activeEmployees)
      
      // Reset employee selection if current employee can't perform the service
      const currentEmployeeId = form.getValues('employeeId')
      if (currentEmployeeId && !activeEmployees.find(e => e.id === currentEmployeeId)) {
        form.setValue('employeeId', '')
      }
    } catch (error) {
      console.error('Error loading employees for service:', error)
      toast.error('Fehler beim Laden der Mitarbeiter')
      setFilteredEmployees([])
    }
  }

  const checkAvailability = useCallback(async () => {
    if (!selectedService || !selectedDate) return

    try {
      setCheckingAvailability(true)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const slots = await AvailabilityService.getAvailableSlots({
        businessId,
        serviceId: selectedService,
        date: dateStr,
        employeeId: selectedEmployee || undefined,
      })
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Error checking availability:', error)
      toast.error('Fehler beim Prüfen der Verfügbarkeit')
    } finally {
      setCheckingAvailability(false)
    }
  }, [businessId, selectedService, selectedDate, selectedEmployee])

  useEffect(() => {
    if (open) {
      loadData()
      // Reset form when dialog opens with new initial values
      if (initialEmployeeId) {
        form.setValue('employeeId', initialEmployeeId)
      }
      // Check if there's already a selected service and load employees for it
      const currentServiceId = form.getValues('serviceId')
      if (currentServiceId) {
        loadEmployeesForService(currentServiceId)
      } else {
        // Only reset filtered employees if no service is selected
        setFilteredEmployees([])
      }
    } else {
      // Reset form and state when dialog closes
      form.reset()
      setSelectedCustomer(null)
      setFilteredEmployees([])
      setAvailableSlots([])
    }
  }, [open, businessId, initialEmployeeId, form])

  useEffect(() => {
    if (selectedService) {
      loadEmployeesForService(selectedService)
    } else {
      setFilteredEmployees([])
    }
  }, [selectedService])

  useEffect(() => {
    if (selectedService && selectedDate) {
      checkAvailability()
    }
  }, [selectedService, selectedEmployee, selectedDate, checkAvailability])

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer)
    form.setValue('customerId', customer.id)
  }

  const handleNewCustomer = (customerData: any) => {
    // Show the new customer as if already selected
    setSelectedCustomer({
      ...customerData,
      id: 'new', // Temporary ID to indicate this is a new customer
      isNew: true, // Flag to identify this is pending creation
    })
    form.setValue('customerId', undefined)
    form.setValue('customerData', customerData)
  }

  const onSubmit = async (data: CreateAppointmentInput) => {
    try {
      setLoading(true)
      
      // If no startTime was set from the TimeSlotPicker but we have initial values
      if (!data.startTime && initialTime && selectedDate) {
        data.startTime = combineDateTimeToUTC(selectedDate, initialTime)
      }
      

      await AppointmentService.create(businessId, data)
      toast.success('Termin erfolgreich erstellt')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Erstellen des Termins')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Neuen Termin erstellen</DialogTitle>
          <DialogDescription>
            Füllen Sie die Details für den neuen Termin aus.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Service Selection */}
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Service auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.duration} Min.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mitarbeiter</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedService}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedService 
                            ? "Wählen Sie zuerst einen Service" 
                            : filteredEmployees.length === 0
                            ? "Keine Mitarbeiter für diesen Service"
                            : "Mitarbeiter auswählen"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredEmployees.length === 0 && selectedService ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Keine Mitarbeiter können diesen Service ausführen
                        </div>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                            {employee.role && (
                              <span className="text-muted-foreground ml-2">
                                ({employee.role})
                              </span>
                            )}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {selectedService && filteredEmployees.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {filteredEmployees.length} Mitarbeiter können diesen Service ausführen
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Date and Time Selection */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datum und Uhrzeit</FormLabel>
                  <FormControl>
                    <TimeSlotPicker
                      selectedDate={selectedDate}
                      availableSlots={availableSlots}
                      initialTime={initialTime}
                      loading={checkingAvailability}
                      onSelect={(slot) => field.onChange(slot.startTime)}
                      disabled={!selectedService || !selectedEmployee || filteredEmployees.length === 0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Selection */}
            <div className="space-y-2">
              <FormLabel>Kunde *</FormLabel>
              <CustomerSearch
                businessId={businessId}
                onSelectCustomer={handleCustomerSelect}
                onNewCustomer={handleNewCustomer}
                selectedCustomer={selectedCustomer}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Zusätzliche Informationen zum Termin..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Termin erstellen
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}