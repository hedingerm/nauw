'use client'

import { DayView } from './views/day-view'
import { WeekView } from './views/week-view'
import { MonthView } from './views/month-view'
import type { CalendarViewType } from './types'

interface CalendarViewProps {
  businessId: string
  currentDate: Date
  viewType: CalendarViewType
  selectedEmployeeId: string | null
  onTimeSlotClick: (date: Date, time: string, employeeId?: string) => void
}

export function CalendarView({
  businessId,
  currentDate,
  viewType,
  selectedEmployeeId,
  onTimeSlotClick,
}: CalendarViewProps) {
  switch (viewType) {
    case 'day':
      return (
        <DayView
          businessId={businessId}
          currentDate={currentDate}
          selectedEmployeeId={selectedEmployeeId}
          onTimeSlotClick={onTimeSlotClick}
        />
      )
    case 'week':
      return (
        <WeekView
          businessId={businessId}
          currentDate={currentDate}
          selectedEmployeeId={selectedEmployeeId}
          onTimeSlotClick={onTimeSlotClick}
        />
      )
    case 'month':
      return (
        <MonthView
          businessId={businessId}
          currentDate={currentDate}
          selectedEmployeeId={selectedEmployeeId}
          onTimeSlotClick={onTimeSlotClick}
        />
      )
    default:
      return null
  }
}