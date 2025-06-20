// Calendar rendering constants
export const CALENDAR_CONSTANTS = {
  // Time slot configuration
  SLOT_HEIGHT_PX: 48, // Height in pixels for each time slot (h-12 in Tailwind)
  SLOT_DURATION_MINUTES: 30, // Duration of each time slot in minutes
  
  // Calendar time range
  START_HOUR: 7, // Calendar starts at 7 AM
  END_HOUR: 20, // Calendar ends at 8 PM
  
  // Visual styling
  APPOINTMENT_PADDING: 4, // Padding in pixels (left-1 right-1 = 4px each side)
  MIN_APPOINTMENT_HEIGHT: 20, // Minimum height for very short appointments
} as const

// Helper functions for consistent calculations
export const calculateSlotPosition = (date: Date): number => {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const totalMinutes = (hours - CALENDAR_CONSTANTS.START_HOUR) * 60 + minutes
  return (totalMinutes / CALENDAR_CONSTANTS.SLOT_DURATION_MINUTES) * CALENDAR_CONSTANTS.SLOT_HEIGHT_PX
}

export const calculateAppointmentHeight = (start: Date, end: Date): number => {
  const duration = (end.getTime() - start.getTime()) / (1000 * 60) // Duration in minutes
  const height = (duration / CALENDAR_CONSTANTS.SLOT_DURATION_MINUTES) * CALENDAR_CONSTANTS.SLOT_HEIGHT_PX
  return Math.max(height, CALENDAR_CONSTANTS.MIN_APPOINTMENT_HEIGHT)
}

// Generate time slots for the calendar
export const generateTimeSlots = (): string[] => {
  const slots: string[] = []
  for (let hour = CALENDAR_CONSTANTS.START_HOUR; hour < CALENDAR_CONSTANTS.END_HOUR; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  return slots
}