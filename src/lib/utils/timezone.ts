import { format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

const TIMEZONE = 'Europe/Zurich'

/**
 * Create a local date/time string for storage
 * Since the database uses Europe/Zurich timezone, we pass the time as-is
 * @param dateStr - Date string in format "YYYY-MM-DD"
 * @param timeStr - Time string in format "HH:mm"
 * @returns Timestamp string without timezone for database storage
 */
export function toLocalDateTime(dateStr: string, timeStr: string): string {
  // Simply combine date and time without timezone
  // The database will interpret this as Europe/Zurich time
  return `${dateStr}T${timeStr}:00`
}

/**
 * Parse an ISO string from the database
 * Since the database uses Europe/Zurich timezone, the times are already local
 * @param isoString - ISO string from database
 * @returns Date object
 */
export function parseDateTime(isoString: string): Date {
  // Parse the ISO string and convert to local timezone
  const date = parseISO(isoString)
  return date
}

/**
 * Format a date in Europe/Zurich timezone
 * @param date - Date object or ISO string
 * @param formatStr - date-fns format string
 * @returns Formatted string
 */
export function formatInZurich(date: Date | string, formatStr: string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

/**
 * Combine date and time into a timestamp string for database storage
 * @param date - Date object or string
 * @param time - Time in HH:mm format
 * @returns Timestamp string without timezone (for database storage)
 */
export function combineDateTimeToISO(date: Date | string, time: string): string {
  const dateStr = typeof date === 'string' 
    ? date 
    : format(date, 'yyyy-MM-dd')
  
  // Simply combine date and time without timezone
  // The database interprets this as Europe/Zurich time
  return `${dateStr}T${time}:00`
}

// Export aliases for backward compatibility
export { toLocalDateTime as toUTC }
export { parseDateTime as fromUTC }
export { combineDateTimeToISO as combineDateTimeToUTC }