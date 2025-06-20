import { format, parseISO, isValid } from 'date-fns'
import { de } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'

const SWITZERLAND_TIMEZONE = 'Europe/Zurich'

/**
 * Format a date string or Date object to Swiss German format
 * @param date - The date to format
 * @param formatStr - The format string (default: 'dd.MM.yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | null | undefined, formatStr: string = 'dd.MM.yyyy'): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return '-'
    
    const zonedDate = toZonedTime(dateObj, SWITZERLAND_TIMEZONE)
    return format(zonedDate, formatStr, { locale: de })
  } catch (error) {
    console.error('Error formatting date:', error)
    return '-'
  }
}

/**
 * Format a time from a date string or Date object
 * @param date - The date containing the time
 * @param formatStr - The format string (default: 'HH:mm')
 * @returns Formatted time string
 */
export function formatTime(date: string | Date | null | undefined, formatStr: string = 'HH:mm'): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return '-'
    
    const zonedDate = toZonedTime(dateObj, SWITZERLAND_TIMEZONE)
    return format(zonedDate, formatStr, { locale: de })
  } catch (error) {
    console.error('Error formatting time:', error)
    return '-'
  }
}

/**
 * Format a date and time together
 * @param date - The date to format
 * @param formatStr - The format string (default: 'dd.MM.yyyy HH:mm')
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date | null | undefined, formatStr: string = 'dd.MM.yyyy HH:mm'): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return '-'
    
    const zonedDate = toZonedTime(dateObj, SWITZERLAND_TIMEZONE)
    return format(zonedDate, formatStr, { locale: de })
  } catch (error) {
    console.error('Error formatting datetime:', error)
    return '-'
  }
}

/**
 * Format a date in relative terms (e.g., "Heute", "Gestern", "3. März")
 * @param date - The date to format
 * @returns Formatted relative date string
 */
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return '-'
    
    const zonedDate = toZonedTime(dateObj, SWITZERLAND_TIMEZONE)
    const today = toZonedTime(new Date(), SWITZERLAND_TIMEZONE)
    
    // Reset time for date comparison
    today.setHours(0, 0, 0, 0)
    zonedDate.setHours(0, 0, 0, 0)
    
    const diffTime = zonedDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Heute'
    if (diffDays === 1) return 'Morgen'
    if (diffDays === -1) return 'Gestern'
    
    return format(zonedDate, 'd. MMMM', { locale: de })
  } catch (error) {
    console.error('Error formatting relative date:', error)
    return '-'
  }
}

/**
 * Get week day name in German
 * @param date - The date
 * @returns Week day name in German
 */
export function getWeekdayName(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'EEEE', { locale: de })
  } catch (error) {
    console.error('Error getting weekday name:', error)
    return ''
  }
}

/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
export function isToday(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const today = new Date()
    
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    )
  } catch (error) {
    console.error('Error checking if date is today:', error)
    return false
  }
}

/**
 * Convert minutes to hours and minutes format
 * @param minutes - Total minutes
 * @returns Formatted string (e.g., "1h 30min")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}