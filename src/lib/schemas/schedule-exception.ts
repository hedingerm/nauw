import { z } from 'zod'

// Exception type enum matching database
export const exceptionTypeEnum = z.enum([
  'unavailable',    // Time off, holiday, sick day
  'modified_hours', // Modified working hours for specific date
  'holiday'         // Public/business holiday
])

export type ExceptionType = z.infer<typeof exceptionTypeEnum>

// Base exception schema
const scheduleExceptionBaseSchema = z.object({
  employeeId: z.string().uuid('Ungültige Mitarbeiter-ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat (YYYY-MM-DD)'),
  type: exceptionTypeEnum,
  reason: z.string().optional(),
})

// Create exception schema for unavailable days
export const createUnavailableExceptionSchema = scheduleExceptionBaseSchema.extend({
  type: z.literal('unavailable'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

// Create exception schema for modified hours
export const createModifiedHoursExceptionSchema = scheduleExceptionBaseSchema.extend({
  type: z.literal('modified_hours'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültiges Zeitformat (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültiges Zeitformat (HH:MM)'),
}).refine(
  (data) => {
    const start = data.startTime.split(':').map(Number)
    const end = data.endTime.split(':').map(Number)
    return (start[0] * 60 + start[1]) < (end[0] * 60 + end[1])
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
  employeeId: z.string().uuid('Ungültige Mitarbeiter-ID'),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Startdatum'),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Enddatum'),
  type: z.literal('unavailable'),
  reason: z.string().optional(),
}).refine(
  (data) => new Date(data.dateFrom) <= new Date(data.dateTo),
  { message: 'Enddatum muss nach oder am Startdatum liegen' }
)

// Update exception schema
export const updateScheduleExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat').optional(),
  type: exceptionTypeEnum.optional(),
  reason: z.string().optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültiges Zeitformat').optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültiges Zeitformat').optional().nullable(),
})

// Filter exceptions schema
export const filterScheduleExceptionsSchema = z.object({
  employeeId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  type: z.array(exceptionTypeEnum).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
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