export type CalendarViewType = 'day' | 'week' | 'month'

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  employeeId: string
  employeeName: string
  customerId: string
  customerName: string
  serviceId: string
  serviceName: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  color?: string
}

export interface TimeGridSlot {
  time: string
  date: Date
  isAvailable: boolean
  isPast: boolean
  isBusinessHours: boolean
}

export interface EmployeeColumn {
  employeeId: string
  employeeName: string
  events: CalendarEvent[]
}