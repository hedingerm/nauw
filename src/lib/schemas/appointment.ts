import { z } from 'zod'

// Appointment status enum matching database
export const appointmentStatusEnum = z.enum([
  'pending',
  'confirmed', 
  'cancelled',
  'completed',
  'no_show'
])

export type AppointmentStatus = z.infer<typeof appointmentStatusEnum>

// Base appointment schema
const appointmentBaseSchema = z.object({
  serviceId: z.string().uuid('Ungültige Service-ID'),
  employeeId: z.string().uuid('Ungültige Mitarbeiter-ID'),
  startTime: z.string().datetime('Ungültiges Startzeit-Format'),
  notes: z.string().optional(),
})

// Create appointment schema (for manual booking by business)
export const createAppointmentSchema = appointmentBaseSchema.extend({
  customerId: z.string().uuid('Ungültige Kunden-ID').optional(),
  customerData: z.object({
    name: z.string().min(1, 'Name ist erforderlich'),
    email: z.string().email('Ungültige E-Mail-Adresse'),
    phone: z.string().optional(),
  }).optional(),
  status: appointmentStatusEnum.default('confirmed'),
})

// Create booking schema (for customer self-booking)
export const createBookingSchema = z.object({
  serviceId: z.string().uuid('Ungültige Service-ID'),
  employeeId: z.string().uuid('Ungültige Mitarbeiter-ID').optional(), // Optional, system can assign
  startTime: z.string().datetime('Ungültiges Startzeit-Format'),
  customer: z.object({
    name: z.string().min(1, 'Name ist erforderlich'),
    email: z.string().email('Ungültige E-Mail-Adresse'),
    phone: z.string().min(10, 'Telefonnummer ist erforderlich'),
  }),
})

// Update appointment schema
export const updateAppointmentSchema = z.object({
  status: appointmentStatusEnum.optional(),
  notes: z.string().optional(),
  startTime: z.string().datetime('Ungültiges Startzeit-Format').optional(),
  employeeId: z.string().uuid('Ungültige Mitarbeiter-ID').optional(),
})

// Filter appointments schema
export const filterAppointmentsSchema = z.object({
  businessId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  status: z.array(appointmentStatusEnum).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  date: z.string().optional(), // For single day view
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