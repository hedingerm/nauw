'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/src/lib/utils'
import { fromUTC } from '@/src/lib/utils/timezone'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import { EmployeeService } from '@/src/lib/services/employee.service'
import { BusinessService } from '@/src/lib/services/business.service'
import { ScheduleExceptionService } from '@/src/lib/services/schedule-exception.service'
import type { CalendarEvent } from '../types'
import type { AppointmentWithRelations } from '@/src/lib/schemas/appointment'
import { CalendarEventCard } from '../calendar-event-card'
import { CALENDAR_CONSTANTS, calculateSlotPosition, calculateAppointmentHeight, generateTimeSlots } from '../constants'
import { Button } from '@/src/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

interface TeamWeekViewProps {
  businessId: string
  currentDate: Date
  onTimeSlotClick: (date: Date, time: string, employeeId?: string) => void
}

export function TeamWeekView({
  businessId,
  currentDate,
  onTimeSlotClick,
}: TeamWeekViewProps) {
  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [scheduleExceptions, setScheduleExceptions] = useState<any[]>([])
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [visibleEmployees, setVisibleEmployees] = useState<Set<string>>(new Set())
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    loadData()
  }, [businessId, currentDate])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load business data
      const businessData = await BusinessService.getBusinessWithRelations(businessId)
      setBusiness(businessData)
      
      // Load all employees
      const employeeData = await EmployeeService.list(businessId)
      const activeEmployees = employeeData.filter(e => e.isActive && e.canPerformServices)
      setEmployees(activeEmployees)
      
      // Initially show all employees
      setVisibleEmployees(new Set(activeEmployees.map(e => e.id)))
      
      // Load appointments for the week
      const dateFrom = format(weekStart, 'yyyy-MM-dd')
      const dateTo = format(addDays(weekStart, 6), 'yyyy-MM-dd')
      
      const appointmentData = await AppointmentService.list({
        businessId,
        dateFrom: new Date(dateFrom).toISOString(),
        dateTo: new Date(dateTo + 'T23:59:59').toISOString(),
      })
      
      setAppointments(appointmentData)
      
      // Load schedule exceptions for the week
      const exceptions: any[] = []
      for (const employee of activeEmployees) {
        const empExceptions = await ScheduleExceptionService.getByEmployeeAndDateRange(
          employee.id,
          dateFrom,
          dateTo
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

  const toggleEmployeeVisibility = (employeeId: string) => {
    setVisibleEmployees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId)
      } else {
        newSet.add(employeeId)
      }
      return newSet
    })
  }

  const toggleAllEmployees = () => {
    if (visibleEmployees.size === employees.length) {
      setVisibleEmployees(new Set())
    } else {
      setVisibleEmployees(new Set(employees.map(e => e.id)))
    }
  }

  const getAppointmentsForDayAndEmployee = (date: Date, employeeId: string): CalendarEvent[] => {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.startTime)
        return apt.employeeId === employeeId && 
               aptDate >= dayStart && 
               aptDate <= dayEnd
      })
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

  const hasScheduleException = (date: Date, employeeId: string): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return scheduleExceptions.some(exc => 
      exc.employeeId === employeeId && 
      exc.date === dateStr && 
      exc.type === 'unavailable'
    )
  }

  const isWithinWorkingHours = (date: Date, time: string, employeeId: string): boolean => {
    if (!business) return false
    
    // Check for schedule exceptions first
    if (hasScheduleException(date, employeeId)) {
      return false
    }
    
    const [hour, minute] = time.split(':').map(Number)
    const slotDate = new Date(date)
    slotDate.setHours(hour, minute, 0, 0)
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay()
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

  const isSlotAvailable = (date: Date, time: string, employeeId: string): boolean => {
    // First check if it's within working hours
    if (!isWithinWorkingHours(date, time, employeeId)) {
      return false
    }
    
    const [hour, minute] = time.split(':').map(Number)
    const slotDate = new Date(date)
    slotDate.setHours(hour, minute, 0, 0)
    
    // Check if slot is in the past
    if (slotDate < new Date()) {
      return false
    }
    
    // Check if slot conflicts with appointments
    const dayAppointments = getAppointmentsForDayAndEmployee(date, employeeId)
    
    // For a quick booking view, assume a default 30-minute service
    // The actual service duration will be checked when creating the appointment
    const slotEnd = new Date(slotDate.getTime() + 30 * 60000) // 30 minutes
    
    return !dayAppointments.some(event => {
      // Check for any overlap between the slot and the appointment
      return slotDate < event.end && slotEnd > event.start
    })
  }

  const handleSlotClick = (date: Date, time: string, employeeId: string) => {
    if (!isSlotAvailable(date, time, employeeId)) return
    
    const [hour, minute] = time.split(':').map(Number)
    const slotDate = new Date(date)
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

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Keine aktiven Mitarbeiter gefunden
      </div>
    )
  }

  const filteredEmployees = employees.filter(e => visibleEmployees.has(e.id))

  return (
    <div className="h-full flex flex-col">
      {/* Employee Filter Bar */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-medium">Mitarbeiter:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllEmployees}
            className="h-8"
          >
            {visibleEmployees.size === employees.length ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            Alle
          </Button>
          {employees.map(employee => (
            <Button
              key={employee.id}
              variant={visibleEmployees.has(employee.id) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleEmployeeVisibility(employee.id)}
              className="h-8"
            >
              {employee.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Week header */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="grid" style={{ gridTemplateColumns: `80px repeat(7, ${filteredEmployees.length * 150}px)` }}>
              <div className="p-2 border-r" />
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="border-r">
                  <div className="p-2 text-center border-b">
                    <div className="font-medium">
                      {format(day, 'EEEE', { locale: de })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(day, 'd. MMM', { locale: de })}
                    </div>
                  </div>
                  {/* Employee names for this day */}
                  <div className="flex">
                    {filteredEmployees.map((employee, idx) => (
                      <div 
                        key={employee.id} 
                        className={cn(
                          "flex-1 px-1 py-1 text-xs text-center font-medium truncate",
                          idx < filteredEmployees.length - 1 && "border-r"
                        )}
                        style={{ width: '150px' }}
                      >
                        {employee.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time grid */}
          <div className="relative">
            <div className="grid" style={{ gridTemplateColumns: `80px repeat(7, ${filteredEmployees.length * 150}px)` }}>
              {/* Time labels */}
              <div>
                {timeSlots.map((time) => (
                  <div key={time} className="h-12 border-b border-r px-2 py-1">
                    <span className="text-sm text-muted-foreground">{time}</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="border-r flex">
                  {filteredEmployees.map((employee, idx) => (
                    <div key={employee.id} className={cn("relative", idx < filteredEmployees.length - 1 && "border-r")} style={{ width: '150px' }}>
                      {timeSlots.map((time) => {
                        const hasException = hasScheduleException(day, employee.id)
                        const withinWorkingHours = isWithinWorkingHours(day, time, employee.id)
                        const available = isSlotAvailable(day, time, employee.id)
                        
                        return (
                          <div
                            key={time}
                            className={cn(
                              'h-12 border-b transition-colors relative overflow-hidden',
                              // Schedule exception (holiday) - red tinted with X pattern
                              hasException && 'bg-red-100',
                              // Non-working hours - dark grey with diagonal stripes pattern
                              !hasException && !withinWorkingHours && 'bg-gray-200',
                              // Working hours but unavailable (busy or past) - light grey
                              !hasException && withinWorkingHours && !available && 'bg-gray-50',
                              // Available slots - white with hover effect
                              available && 'hover:bg-muted cursor-pointer bg-white'
                            )}
                            onClick={() => available && handleSlotClick(day, time, employee.id)}
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
                        {getAppointmentsForDayAndEmployee(day, employee.id).map((event) => {
                          const top = getPositionForTime(event.start)
                          const height = getHeightForDuration(event.start, event.end)
                          
                          return (
                            <div
                              key={event.id}
                              className="absolute left-1 right-1 pointer-events-auto"
                              style={{
                                top: top + 'px',
                                height: height + 'px',
                              }}
                            >
                              <CalendarEventCard event={event} variant="minimal" onUpdate={loadData} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}