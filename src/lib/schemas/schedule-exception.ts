import { z } from 'zod'
import {
  uuidSchema,
  timeStringSchema,
  LIMITS,
  sanitizeInput
} from './validation-rules'

// Exception type enum matching database
export const exceptionTypeEnum = z.enum([
  'unavailable',    // Time off, holiday, sick day
  'modified_hours', // Modified working hours for specific date
  'holiday'         // Public/business holiday
])

export type ExceptionType = z.infer<typeof exceptionTypeEnum>

// Reason validation
const reasonSchema = z.string()
  .trim()
  .max(200, 'Maximal 200 Zeichen erlaubt')
  .regex(/^[^<>]*$/, 'HTML-Tags sind nicht erlaubt')
  .transform(sanitizeInput)
  .optional()

// Date validation for exceptions
const exceptionDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat (YYYY-MM-DD)')
  .refine(
    (date) => {
      const d = new Date(date)
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      // Allow exceptions up to 2 years in future
      const maxFuture = new Date(now)
      maxFuture.setFullYear(maxFuture.getFullYear() + 2)
      return d >= now && d <= maxFuture
    },
    'Datum muss zwischen heute und maximal 2 Jahre in der Zukunft liegen'
  )

// Base exception schema
const scheduleExceptionBaseSchema = z.object({
  employeeId: uuidSchema,
  date: exceptionDateSchema,
  type: exceptionTypeEnum,
  reason: reasonSchema,
})

// Create exception schema for unavailable days
export const createUnavailableExceptionSchema = scheduleExceptionBaseSchema.extend({
  type: z.literal('unavailable'),
  startTime: timeStringSchema.optional(),
  endTime: timeStringSchema.optional(),
})

// Create exception schema for modified hours
export const createModifiedHoursExceptionSchema = scheduleExceptionBaseSchema.extend({
  type: z.literal('modified_hours'),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
}).refine(
  (data) => {
    const start = parseInt(data.startTime.replace(':', ''))
    const end = parseInt(data.endTime.replace(':', ''))
    return start < end
  },
  { message: 'Endzeit muss nach Startzeit liegen' }
)

// Create exception schema (union of both types)
export const createScheduleExceptionSchema = z.union([
  createUnavailableExceptionSchema,
  createModifiedHoursExceptionSchema,
])

// Create multiple exceptions schema (for date ranges)
export const createScheduleExceptionRangeSchema = z.object({
  employeeId: uuidSchema,
  dateFrom: exceptionDateSchema,
  dateTo: exceptionDateSchema,
  type: z.literal('unavailable'),
  reason: reasonSchema,
}).refine(
  (data) => new Date(data.dateFrom) <= new Date(data.dateTo),
  { message: 'Enddatum muss nach oder am Startdatum liegen' }
).refine(
  (data) => {
    const start = new Date(data.dateFrom)
    const end = new Date(data.dateTo)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30
  },
  { message: 'Zeitraum darf maximal 30 Tage umfassen' }
)

// Update exception schema
export const updateScheduleExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat').optional(),
  type: exceptionTypeEnum.optional(),
  reason: reasonSchema.nullable(),
  startTime: timeStringSchema.optional().nullable(),
  endTime: timeStringSchema.optional().nullable(),
})

// Filter exceptions schema
export const filterScheduleExceptionsSchema = z.object({
  employeeId: uuidSchema.optional(),
  businessId: uuidSchema.optional(),
  type: z.array(exceptionTypeEnum).max(3).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat').optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Ungültiges Monatsformat (YYYY-MM)').optional(),
})

// Schedule exception with relations type
export type ScheduleExceptionWithRelations = {
  id: string
  employeeId: string
  date: string
  startTime: string | null
  endTime: string | null
  type: ExceptionType
  reason: string | null
  createdAt: string
  updatedAt: string
  employee?: {
    id: string
    name: string
    email: string
  }
}

// Type exports
export type CreateScheduleExceptionInput = z.infer<typeof createScheduleExceptionSchema>
export type CreateScheduleExceptionRangeInput = z.infer<typeof createScheduleExceptionRangeSchema>
export type UpdateScheduleExceptionInput = z.infer<typeof updateScheduleExceptionSchema>
export type FilterScheduleExceptionsInput = z.infer<typeof filterScheduleExceptionsSchema>