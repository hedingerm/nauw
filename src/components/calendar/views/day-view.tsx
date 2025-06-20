'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/src/lib/utils'
import { combineDateTimeToUTC, fromUTC } from '@/src/lib/utils/timezone'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import { EmployeeService } from '@/src/lib/services/employee.service'
import { BusinessService } from '@/src/lib/services/business.service'
import { ScheduleExceptionService } from '@/src/lib/services/schedule-exception.service'
import type { CalendarEvent, TimeGridSlot, EmployeeColumn } from '../types'
import type { AppointmentWithRelations } from '@/src/lib/schemas/appointment'
import { CalendarEventCard } from '../calendar-event-card'
import { CALENDAR_CONSTANTS, calculateSlotPosition, calculateAppointmentHeight, generateTimeSlots } from '../constants'

interface DayViewProps {
  businessId: string
  currentDate: Date
  selectedEmployeeId: string | null
  onTimeSlotClick: (date: Date, time: string, employeeId?: string) => void
}

export function DayView({
  businessId,
  currentDate,
  selectedEmployeeId,
  onTimeSlotClick,
}: DayViewProps) {
  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [scheduleExceptions, setScheduleExceptions] = useState<any[]>([])
  const [timeSlots, setTimeSlots] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [businessId, currentDate, selectedEmployeeId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load business data
      const businessData = await BusinessService.getBusinessWithRelations(businessId)
      setBusiness(businessData)
      
      // Load employees
      let employeeData: any[] = []
      if (selectedEmployeeId) {
        const employee = await EmployeeService.getById(selectedEmployeeId)
        employeeData = [employee]
      } else {
        employeeData = await EmployeeService.list(businessId)
        employeeData = employeeData.filter(e => e.isActive && e.canPerformServices)
      }
      setEmployees(employeeData)
      
      // Load appointments
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const appointmentData = await AppointmentService.list({
        businessId,
        date: dateStr,
        employeeId: selectedEmployeeId || undefined,
      })
      setAppointments(appointmentData)
      
      // Load schedule exceptions for the day
      const exceptions: any[] = []
      for (const employee of employeeData) {
        const empExceptions = await ScheduleExceptionService.getByEmployeeAndDateRange(
          employee.id,
          dateStr,
          dateStr
        )
        exceptions.push(...empExceptions)
      }
      setScheduleExceptions(exceptions)
      
      // Generate time slots
      setTimeSlots(generateTimeSlots())
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAppointmentsForEmployee = (employeeId: string): CalendarEvent[] => {
    return appointments
      .filter(apt => apt.employeeId === employeeId)
      .map(apt => ({
        id: apt.id,
        title: apt.customer?.name || 'Unbekannter Kunde',
        start: fromUTC(apt.startTime),
        end: fromUTC(apt.endTime),
        employeeId: apt.employeeId,
        employeeName: apt.employee?.name || '',
        customerId: apt.customerId,
        customerName: apt.customer?.name || '',
        serviceId: apt.serviceId,
        serviceName: apt.service?.name || '',
        status: apt.status,
        color: getStatusColor(apt.status),
      }))
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 border-green-300 text-green-900'
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900'
      case 'cancelled':
        return 'bg-red-100 border-red-300 text-red-900'
      case 'completed':
        return 'bg-gray-100 border-gray-300 text-gray-700'
      case 'no_show':
        return 'bg-orange-100 border-orange-300 text-orange-900'
      default:
        return 'bg-blue-100 border-blue-300 text-blue-900'
    }
  }

  const hasScheduleException = (employeeId: string): boolean => {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    return scheduleExceptions.some(exc => 
      exc.employeeId === employeeId && 
      exc.date === dateStr && 
      exc.type === 'unavailable'
    )
  }

  const isWithinWorkingHours = (time: string, employeeId: string): boolean => {
    if (!business) return false
    
    // Check for schedule exceptions first
    if (hasScheduleException(employeeId)) {
      return false
    }
    
    const [hour, minute] = time.split(':').map(Number)
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = currentDate.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    // Find the employee
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return false
    
    // Check if employee has working hours defined
    let schedule: any = null
    
    if (employee.workingHours) {
      // If employee has custom working hours, only use those
      if (employee.workingHours[dayName]) {
        schedule = employee.workingHours[dayName]
      } else {
        // Employee has custom hours but not for this day - they don't work this day
        return false
      }
    } else {
      // No custom employee hours, fall back to business hours
      if (business.businessHours && business.businessHours[dayName]) {
        schedule = business.businessHours[dayName]
      }
    }
    
    if (!schedule) return false
    
    // Check if it's a working day
    const openTime = schedule.start || schedule.open
    const closeTime = schedule.end || schedule.close
    
    if (!openTime || !closeTime) return false
    
    // Parse times
    const [openHour, openMinute] = openTime.split(':').map(Number)
    const [closeHour, closeMinute] = closeTime.split(':').map(Number)
    
    const timeInMinutes = hour * 60 + minute
    const openInMinutes = openHour * 60 + openMinute
    const closeInMinutes = closeHour * 60 + closeMinute
    
    // Check if within regular hours
    if (timeInMinutes < openInMinutes || timeInMinutes >= closeInMinutes) {
      return false
    }
    
    // Check lunch break if exists
    if (schedule.hasLunchBreak && schedule.lunchStart && schedule.lunchEnd) {
      const [lunchStartHour, lunchStartMinute] = schedule.lunchStart.split(':').map(Number)
      const [lunchEndHour, lunchEndMinute] = schedule.lunchEnd.split(':').map(Number)
      
      const lunchStartInMinutes = lunchStartHour * 60 + lunchStartMinute
      const lunchEndInMinutes = lunchEndHour * 60 + lunchEndMinute
      
      if (timeInMinutes >= lunchStartInMinutes && timeInMinutes < lunchEndInMinutes) {
        return false
      }
    }
    
    return true
  }

  const isSlotAvailable = (time: string, employeeId: string): boolean => {
    // First check if it's within working hours
    if (!isWithinWorkingHours(time, employeeId)) {
      return false
    }
    
    // Create slot date with explicit timezone
    const slotDateUTC = combineDateTimeToUTC(currentDate, time)
    const slotDate = new Date(slotDateUTC)
    
    // Check if slot is in the past
    if (slotDate < new Date()) {
      return false
    }
    
    // Check if slot conflicts with appointments
    const employeeAppointments = getAppointmentsForEmployee(employeeId)
    const slotDateLocal = fromUTC(slotDateUTC)
    const slotEndLocal = new Date(slotDateLocal.getTime() + 30 * 60000) // 30 minutes
    
    return !employeeAppointments.some(event => {
      return slotDateLocal < event.end && slotEndLocal > event.start
    })
  }

  const handleSlotClick = (time: string, employeeId: string) => {
    if (!isSlotAvailable(time, employeeId)) return
    
    const [hour, minute] = time.split(':').map(Number)
    const slotDate = new Date(currentDate)
    slotDate.setHours(hour, minute, 0, 0)
    
    
    onTimeSlotClick(slotDate, time, employeeId)
  }

  const getPositionForTime = (date: Date): number => {
    return calculateSlotPosition(date)
  }

  const getHeightForDuration = (start: Date, end: Date): number => {
    return calculateAppointmentHeight(start, end)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="grid" style={{ gridTemplateColumns: '80px repeat(' + employees.length + ', 1fr)' }}>
            <div className="p-2 border-r">
              <span className="text-sm text-muted-foreground">Zeit</span>
            </div>
            {employees.map((employee) => (
              <div key={employee.id} className="p-2 border-r text-center">
                <span className="font-medium">{employee.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time grid */}
        <div className="relative">
          <div className="grid" style={{ gridTemplateColumns: '80px repeat(' + employees.length + ', 1fr)' }}>
            {/* Time labels */}
            <div>
              {timeSlots.map((time) => (
                <div key={time} className="h-12 border-b border-r px-2 py-1">
                  <span className="text-sm text-muted-foreground">{time}</span>
                </div>
              ))}
            </div>

            {/* Employee columns */}
            {employees.map((employee) => {
              const hasException = hasScheduleException(employee.id)
              
              return (
                <div key={employee.id} className="relative">
                  {timeSlots.map((time) => {
                    const withinWorkingHours = isWithinWorkingHours(time, employee.id)
                    const available = isSlotAvailable(time, employee.id)
                    
                    return (
                      <div
                        key={time}
                        className={cn(
                          'h-12 border-b border-r transition-colors relative overflow-hidden',
                          // Schedule exception (holiday) - red tinted with X pattern
                          hasException && 'bg-red-100',
                          // Non-working hours - dark grey with diagonal stripes pattern
                          !hasException && !withinWorkingHours && 'bg-gray-200',
                          // Working hours but unavailable (busy or past) - light grey
                          !hasException && withinWorkingHours && !available && 'bg-gray-50',
                          // Available slots - white with hover effect
                          available && 'hover:bg-muted cursor-pointer bg-white'
                        )}
                        onClick={() => available && handleSlotClick(time, employee.id)}
                      >
                        {/* X pattern for exceptions/holidays */}
                        {hasException && (
                          <div 
                            className="absolute inset-0 opacity-30"
                            style={{
                              backgroundImage: `
                                repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(220,38,38,0.3) 10px, rgba(220,38,38,0.3) 20px),
                                repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(220,38,38,0.3) 10px, rgba(220,38,38,0.3) 20px)
                              `
                            }}
                          />
                        )}
                        {/* Diagonal stripes for non-working hours */}
                        {!hasException && !withinWorkingHours && (
                          <div 
                            className="absolute inset-0 opacity-20"
                            style={{
                              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)'
                            }}
                          />
                        )}
                      </div>
                    )
                  })}

                  {/* Appointments */}
                  <div className="absolute inset-0 pointer-events-none">
                    {getAppointmentsForEmployee(employee.id).map((event) => (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 pointer-events-auto"
                        style={{
                          top: getPositionForTime(event.start) + 'px',
                          height: getHeightForDuration(event.start, event.end) + 'px',
                        }}
                      >
                        <CalendarEventCard event={event} onUpdate={loadData} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}