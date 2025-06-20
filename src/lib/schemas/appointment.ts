import { z } from 'zod'
import {
  uuidSchema,
  notesSchema,
  nameSchema,
  emailSchema,
  swissPhoneSchema,
  futureDateTimeSchema,
  LIMITS
} from './validation-rules'

// Appointment status enum matching database
export const appointmentStatusEnum = z.enum([
  'pending',
  'confirmed', 
  'cancelled',
  'completed',
  'no_show'
])

export type AppointmentStatus = z.infer<typeof appointmentStatusEnum>

// Cancellation reason validation
const cancellationReasonSchema = z.string()
  .trim()
  .max(200, 'Maximal 200 Zeichen erlaubt')
  .regex(/^[^<>]*$/, 'HTML-Tags sind nicht erlaubt')
  .optional()

// Base appointment schema
const appointmentBaseSchema = z.object({
  serviceId: uuidSchema,
  employeeId: uuidSchema,
  startTime: z.string().datetime('Ungültiges Startzeit-Format'),
  notes: notesSchema,
})

// Create appointment schema (for manual booking by business)
export const createAppointmentSchema = appointmentBaseSchema.extend({
  customerId: uuidSchema.optional(),
  customerData: z.object({
    name: nameSchema,
    email: z.union([emailSchema, z.literal('').transform(() => undefined)]).optional(),
    phone: swissPhoneSchema,
  }).optional(),
  status: appointmentStatusEnum.default('confirmed'),
  cancellationReason: cancellationReasonSchema,
})

// Create booking schema (for customer self-booking)
export const createBookingSchema = z.object({
  serviceId: uuidSchema,
  employeeId: uuidSchema.optional(), // Optional, system can assign
  startTime: futureDateTimeSchema,
  customer: z.object({
    name: nameSchema,
    email: emailSchema,
    phone: swissPhoneSchema,
  }),
  notes: notesSchema,
})

// Update appointment schema
export const updateAppointmentSchema = z.object({
  status: appointmentStatusEnum.optional(),
  notes: notesSchema,
  startTime: z.string().datetime('Ungültiges Startzeit-Format').optional(),
  employeeId: uuidSchema.optional(),
  cancellationReason: cancellationReasonSchema,
})

// Filter appointments schema
export const filterAppointmentsSchema = z.object({
  businessId: uuidSchema.optional(),
  customerId: uuidSchema.optional(),
  employeeId: uuidSchema.optional(),
  serviceId: uuidSchema.optional(),
  status: z.array(appointmentStatusEnum).max(5).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss im Format YYYY-MM-DD sein')
    .optional(), // For single day view
})

// Appointment with relations type
export type AppointmentWithRelations = {
  id: string
  businessId: string
  customerId: string
  employeeId: string
  serviceId: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  employee?: {
    id: string
    name: string
    email: string
  }
  service?: {
    id: string
    name: string
    duration: number
    price: string
    bufferBefore?: number
    bufferAfter?: number
  }
}

// Type exports
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
export type FilterAppointmentsInput = z.infer<typeof filterAppointmentsSchema>