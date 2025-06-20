import { z } from 'zod'
import {
  businessNameSchema,
  emailSchema,
  swissPhoneSchema,
  addressSchema,
  citySchema,
  swissPostalCodeSchema,
  timeStringSchema,
  descriptionSchema,
  LIMITS
} from './validation-rules'

// Business hours validation with time format
const dayHoursSchema = z.object({
  open: timeStringSchema,
  close: timeStringSchema,
}).refine(
  (data) => {
    const open = parseInt(data.open.replace(':', ''))
    const close = parseInt(data.close.replace(':', ''))
    return open < close
  },
  { message: 'Öffnungszeit muss vor Schließzeit liegen' }
)

export const businessHoursSchema = z.object({
  monday: dayHoursSchema.optional(),
  tuesday: dayHoursSchema.optional(),
  wednesday: dayHoursSchema.optional(),
  thursday: dayHoursSchema.optional(),
  friday: dayHoursSchema.optional(),
  saturday: dayHoursSchema.optional(),
  sunday: dayHoursSchema.optional(),
})

// Business type validation
const businessTypeSchema = z.string()
  .min(1, 'Geschäftstyp ist erforderlich')
  .max(50, 'Maximal 50 Zeichen erlaubt')
  .regex(/^[a-zA-Z0-9äöüÄÖÜ\s\-&]+$/, 'Ungültige Zeichen im Geschäftstyp')

export const createBusinessSchema = z.object({
  name: businessNameSchema,
  email: emailSchema,
  phone: swissPhoneSchema,
  address: addressSchema,
  city: citySchema,
  postalCode: swissPostalCodeSchema,
  country: z.string()
    .min(1, 'Land ist erforderlich')
    .max(50, 'Maximal 50 Zeichen erlaubt')
    .default('Schweiz'),
  businessHours: businessHoursSchema,
  type: businessTypeSchema,
  description: descriptionSchema,
})

export const updateBusinessSchema = createBusinessSchema.partial().extend({
  acceptAppointmentsAutomatically: z.boolean().optional(),
})

export type BusinessHours = z.infer<typeof businessHoursSchema>
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>