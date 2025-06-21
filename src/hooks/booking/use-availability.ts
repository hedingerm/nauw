import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { AvailabilityService } from '@/src/lib/services/availability.service'
import type { Database } from '@/src/lib/supabase/database.types'

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
  availableEmployees?: Array<{ id: string; name: string }>
}

interface UseAvailabilityParams {
  businessId: string | null
  selectedService: Service | null
  selectedDate: Date | undefined
  selectedEmployee: Employee | null
  employees: Employee[]
}

interface UseAvailabilityReturn {
  availableSlots: TimeSlot[]
  loadingSlots: boolean
  error: string | null
  refreshSlots: () => Promise<void>
}

export function useAvailability({
  businessId,
  selectedService,
  selectedDate,
  selectedEmployee,
  employees
}: UseAvailabilityParams): UseAvailabilityReturn {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAvailableSlots = async () => {
    if (!selectedService || !selectedDate || !businessId) {
      setAvailableSlots([])
      return
    }

    try {
      setLoadingSlots(true)
      setError(null)
      
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
        
        // Group slots by time to show aggregated availability
        const slotsByTime = allSlots.reduce((acc, slot) => {
          if (!acc[slot.time]) {
            acc[slot.time] = {
              time: slot.time,
              available: false,
              availableEmployees: []
            }
          }
          
          if (slot.available) {
            acc[slot.time].available = true
            acc[slot.time].availableEmployees!.push({
              id: slot.employeeId!,
              name: slot.employeeName!
            })
          }
          
          return acc
        }, {} as Record<string, TimeSlot>)
        
        // Convert to array and add employee count
        const aggregatedSlots = Object.values(slotsByTime).map(slot => ({
          ...slot,
          availableEmployeeCount: slot.availableEmployees?.length || 0
        }))
        
        // Sort by time
        aggregatedSlots.sort((a, b) => a.time.localeCompare(b.time))
        
        setAvailableSlots(aggregatedSlots)
      }
    } catch (error) {
      console.error('Error loading available slots:', error)
      setError('Fehler beim Laden der verfügbaren Termine')
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  useEffect(() => {
    loadAvailableSlots()
  }, [selectedService, selectedDate, businessId]) // Note: We don't reload when employee changes

  return {
    availableSlots,
    loadingSlots,
    error,
    refreshSlots: loadAvailableSlots
  }
}