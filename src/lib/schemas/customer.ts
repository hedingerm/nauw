import { z } from 'zod'
import { isValidSwissPhone } from '@/src/lib/utils/normalize'

// Create customer schema
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || isValidSwissPhone(val),
      'Ungültige Schweizer Telefonnummer. Bitte verwenden Sie das Format 079 123 45 67'
    ),
  notes: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string()
    .optional()
    .refine(
      (val) => !val || val.match(/^\d{4}$/),
      'PLZ muss 4 Ziffern haben'
    ),
  birthday: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'sms']).optional(),
  marketingConsent: z.boolean().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  vipStatus: z.boolean().optional(),
})

// Update customer schema
export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional(),
  phone: z.string()
    .optional()
    .nullable()
    .refine(
      (val) => val === null || !val || isValidSwissPhone(val),
      'Ungültige Schweizer Telefonnummer. Bitte verwenden Sie das Format 079 123 45 67'
    ),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string()
    .optional()
    .nullable()
    .refine(
      (val) => val === null || !val || val.match(/^\d{4}$/),
      'PLZ muss 4 Ziffern haben'
    ),
  birthday: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  preferredContactMethod: z.enum(['email', 'phone', 'sms']).optional().nullable(),
  marketingConsent: z.boolean().optional(),
  source: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  vipStatus: z.boolean().optional(),
  lastContactedAt: z.string().optional().nullable(),
})

// Search customers schema
export const searchCustomersSchema = z.object({
  query: z.string().min(1, 'Suchbegriff ist erforderlich'),
  businessId: z.string().uuid('Ungültige Business-ID'),
  limit: z.number().min(1).max(50).default(10),
})

// Filter customers schema
export const filterCustomersSchema = z.object({
  businessId: z.string().uuid('Ungültige Business-ID'),
  isActive: z.boolean().optional(),
  hasAppointments: z.boolean().optional(),
  sortBy: z.enum(['name', 'createdAt', 'lastAppointment']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Customer with relations type
export type CustomerWithRelations = {
  id: string
  businessId: string
  name: string
  email: string
  phone: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  appointmentCount?: number
  lastAppointmentDate?: string | null
  totalSpent?: number
  vipStatus?: boolean | null
  address?: string | null
  birthday?: string | null
  city?: string | null
  gender?: string | null
  lastContactedAt?: string | null
  marketingConsent?: boolean | null
  postalCode?: string | null
  preferredContactMethod?: string | null
  source?: string | null
  tags?: string[] | null
}

// Customer lookup result (for mini-CRM)
export type CustomerLookupResult = {
  id: string
  name: string
  email: string
  phone: string | null
  lastVisit?: string | null
  visitCount?: number
}

// Customer note type
export type CustomerNote = {
  id: string
  customerId: string
  businessId: string
  authorId: string
  content: string
  isPrivate: boolean | null
  createdAt: string | null
  updatedAt: string | null
  author?: {
    name: string
    role: string
  }
}

// Customer group type
export type CustomerGroup = {
  id: string
  businessId: string
  name: string
  description: string | null
  color: string
  createdAt: string | null
  updatedAt: string | null
  memberCount?: number
}

// Customer details (for CRM view)
export type CustomerDetails = CustomerWithRelations & {
  groups?: CustomerGroup[]
  notes?: CustomerNote[]
  upcomingAppointments?: {
    id: string
    startTime: string
    serviceName: string
    employeeName: string
  }[]
  appointmentHistory?: {
    id: string
    startTime: string
    serviceName: string
    employeeName: string
    status: string
    price: number
  }[]
}

// Customer note schemas
export const createCustomerNoteSchema = z.object({
  content: z.string().min(1, 'Notiz ist erforderlich'),
  isPrivate: z.boolean().default(false),
})

export const updateCustomerNoteSchema = z.object({
  content: z.string().min(1, 'Notiz ist erforderlich').optional(),
  isPrivate: z.boolean().optional(),
})

// Customer group schemas
export const createCustomerGroupSchema = z.object({
  name: z.string().min(1, 'Gruppenname ist erforderlich'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Ungültiges Farbformat').default('#6366f1'),
})

export const updateCustomerGroupSchema = z.object({
  name: z.string().min(1, 'Gruppenname ist erforderlich').optional(),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Ungültiges Farbformat').optional(),
})

// Type exports
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type SearchCustomersInput = z.infer<typeof searchCustomersSchema>
export type FilterCustomersInput = z.infer<typeof filterCustomersSchema>
export type CreateCustomerNoteInput = z.infer<typeof createCustomerNoteSchema>
export type UpdateCustomerNoteInput = z.infer<typeof updateCustomerNoteSchema>
export type CreateCustomerGroupInput = z.infer<typeof createCustomerGroupSchema>
export type UpdateCustomerGroupInput = z.infer<typeof updateCustomerGroupSchema>