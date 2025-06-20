'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/src/lib/utils'
import { AppointmentService } from '@/src/lib/services/appointment.service'
import type { AppointmentWithRelations } from '@/src/lib/schemas/appointment'
import { calculateAppointmentHeight } from '../constants'

interface MonthViewProps {
  businessId: string
  currentDate: Date
  selectedEmployeeId: string | null
  onTimeSlotClick: (date: Date, time: string, employeeId?: string) => void
}

export function MonthView({
  businessId,
  currentDate,
  selectedEmployeeId,
  onTimeSlotClick,
}: MonthViewProps) {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  useEffect(() => {
    loadData()
  }, [businessId, currentDate, selectedEmployeeId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load appointments for the month
      const dateFrom = format(calendarStart, 'yyyy-MM-dd')
      const dateTo = format(calendarEnd, 'yyyy-MM-dd')
      
      const appointmentData = await AppointmentService.list({
        businessId,
        dateFrom: new Date(dateFrom).toISOString(),
        dateTo: new Date(dateTo + 'T23:59:59').toISOString(),
        employeeId: selectedEmployeeId || undefined,
      })
      setAppointments(appointmentData)
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAppointmentsForDay = (date: Date): AppointmentWithRelations[] => {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime)
      return aptDate >= dayStart && aptDate <= dayEnd && apt.status !== 'cancelled'
    })
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-gray-500'
      case 'no_show':
        return 'bg-orange-500'
      default:
        return 'bg-blue-500'
    }
  }

  const handleDayClick = (date: Date) => {
    // For month view, clicking a day could switch to day view
    // For now, we'll create an appointment at 9:00 AM
    if (date >= new Date()) {
      onTimeSlotClick(date, '09:00')
    }
  }

  const getAppointmentHeight = (startTime: string, endTime: string): number => {
    const start = new Date(startTime)
    const end = new Date(endTime)
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
    <div className="h-full p-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
          <div key={day} className="bg-muted p-2 text-center font-semibold text-sm">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-b-lg overflow-hidden flex-1">
        {calendarDays.map((day) => {
          const dayAppointments = getAppointmentsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isClickable = day >= new Date() && isCurrentMonth
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'bg-background p-2 min-h-[100px] relative',
                !isCurrentMonth && 'text-muted-foreground bg-muted/30',
                isToday(day) && 'bg-primary/5',
                isClickable && 'cursor-pointer hover:bg-muted/50'
              )}
              onClick={() => isClickable && handleDayClick(day)}
            >
              <div className="font-medium text-sm mb-1">
                {format(day, 'd')}
              </div>
              
              {/* Appointment indicators */}
              {dayAppointments.length > 0 && (
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className="text-xs p-1 rounded truncate"
                      style={{
                        backgroundColor: `rgb(var(--${getStatusColor(apt.status).replace('bg-', '')}) / 0.2)`,
                        height: `${getAppointmentHeight(apt.startTime, apt.endTime)}px`,
                        minHeight: '20px'
                      }}
                    >
                      <span className="font-medium">
                        {format(new Date(apt.startTime), 'HH:mm')}
                      </span>
                      {' '}
                      <span className="opacity-75">
                        {apt.customer?.name}
                      </span>
                    </div>
                  ))}
                  
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayAppointments.length - 3} weitere
                    </div>
                  )}
                </div>
              )}
              
              {/* Appointment count badge */}
              {dayAppointments.length > 0 && (
                <div className="absolute top-1 right-1">
                  <div className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {dayAppointments.length}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}