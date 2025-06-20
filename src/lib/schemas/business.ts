import { z } from 'zod'

export const businessHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string() }).optional(),
  tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
  wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
  thursday: z.object({ open: z.string(), close: z.string() }).optional(),
  friday: z.object({ open: z.string(), close: z.string() }).optional(),
  saturday: z.object({ open: z.string(), close: z.string() }).optional(),
  sunday: z.object({ open: z.string(), close: z.string() }).optional(),
})

export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().min(1, 'Telefonnummer ist erforderlich'),
  address: z.string().min(1, 'Adresse ist erforderlich'),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  postalCode: z.string().regex(/^\d{4}$/, 'Postleitzahl muss 4 Ziffern haben'),
  country: z.string().min(1, 'Land ist erforderlich'),
  businessHours: businessHoursSchema,
})

export const updateBusinessSchema = createBusinessSchema.partial().extend({
  acceptAppointmentsAutomatically: z.boolean().optional(),
})

export type BusinessHours = z.infer<typeof businessHoursSchema>
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>