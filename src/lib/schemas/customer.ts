import { z } from 'zod'
import {
  nameSchema,
  emailSchema,
  swissPhoneSchema,
  notesSchema,
  addressSchema,
  citySchema,
  swissPostalCodeSchema,
  pastDateSchema,
  tagsArraySchema,
  hexColorSchema,
  LIMITS,
  sanitizeInput
} from './validation-rules'

// Source validation (where customer came from)
const sourceSchema = z.string()
  .max(50, 'Maximal 50 Zeichen erlaubt')
  .regex(/^[a-zA-Z0-9äöüÄÖÜ\s\-]+$/, 'Ungültige Zeichen')
  .transform(sanitizeInput)
  .optional()

// Helper to make empty strings undefined
const emptyStringToUndefined = z.literal('').transform(() => undefined)

// Create customer schema
export const createCustomerSchema = z.object({
  name: nameSchema,
  email: z.union([emailSchema, emptyStringToUndefined]).optional(),
  phone: swissPhoneSchema,
  notes: z.union([notesSchema, emptyStringToUndefined]).optional(),
  address: z.union([addressSchema, emptyStringToUndefined]).optional(),
  city: z.union([citySchema, emptyStringToUndefined]).optional(),
  postalCode: z.union([swissPostalCodeSchema, emptyStringToUndefined]).optional(),
  birthday: z.union([pastDateSchema, emptyStringToUndefined]).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'sms']).optional(),
  marketingConsent: z.boolean().optional(),
  source: z.union([sourceSchema, emptyStringToUndefined]).optional(),
  tags: tagsArraySchema.optional(),
  vipStatus: z.boolean().optional(),
})

// Update customer schema
export const updateCustomerSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: swissPhoneSchema.optional().nullable(),
  notes: notesSchema.nullable(),
  isActive: z.boolean().optional(),
  address: addressSchema.optional().nullable(),
  city: citySchema.optional().nullable(),
  postalCode: swissPostalCodeSchema.optional().nullable(),
  birthday: pastDateSchema.optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  preferredContactMethod: z.enum(['email', 'phone', 'sms']).optional().nullable(),
  marketingConsent: z.boolean().optional(),
  source: sourceSchema.nullable(),
  tags: tagsArraySchema.nullable(),
  vipStatus: z.boolean().optional(),
  lastContactedAt: z.string().optional().nullable(),
})

// Search customers schema
export const searchCustomersSchema = z.object({
  query: z.string()
    .min(1, 'Suchbegriff ist erforderlich')
    .max(100, 'Maximal 100 Zeichen erlaubt')
    .transform(sanitizeInput),
  businessId: z.string().uuid('Ungültige Business-ID'),
  limit: z.number().min(1).max(50).default(10),
})

// Filter customers schema
export const filterCustomersSchema = z.object({
  businessId: z.string().uuid('Ungültige Business-ID'),
  isActive: z.boolean().optional(),
  vipStatus: z.boolean().optional(),
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
  email: string | null
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
  email: string | null
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
  content: notesSchema
    .refine(val => val && val.trim().length > 0, 'Notiz ist erforderlich'),
  isPrivate: z.boolean().default(false),
})

export const updateCustomerNoteSchema = z.object({
  content: notesSchema.optional(),
  isPrivate: z.boolean().optional(),
})

// Customer group schemas
export const createCustomerGroupSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Gruppenname ist erforderlich')
    .max(LIMITS.CATEGORY_NAME_MAX, `Maximal ${LIMITS.CATEGORY_NAME_MAX} Zeichen erlaubt`)
    .regex(/^[a-zA-Z0-9äöüÄÖÜ\s\-]+$/, 'Ungültige Zeichen im Gruppennamen'),
  description: z.string()
    .max(LIMITS.SHORT_DESCRIPTION_MAX, `Maximal ${LIMITS.SHORT_DESCRIPTION_MAX} Zeichen erlaubt`)
    .transform(sanitizeInput)
    .optional(),
  color: hexColorSchema.default('#6366f1'),
})

export const updateCustomerGroupSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Gruppenname ist erforderlich')
    .max(LIMITS.CATEGORY_NAME_MAX, `Maximal ${LIMITS.CATEGORY_NAME_MAX} Zeichen erlaubt`)
    .regex(/^[a-zA-Z0-9äöüÄÖÜ\s\-]+$/, 'Ungültige Zeichen im Gruppennamen')
    .optional(),
  description: z.string()
    .max(LIMITS.SHORT_DESCRIPTION_MAX, `Maximal ${LIMITS.SHORT_DESCRIPTION_MAX} Zeichen erlaubt`)
    .transform(sanitizeInput)
    .optional()
    .nullable(),
  color: hexColorSchema.optional(),
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