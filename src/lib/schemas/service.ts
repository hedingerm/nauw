import { z } from 'zod'
import {
  shortDescriptionSchema,
  durationSchema,
  priceSchema,
  bufferSchema,
  uuidSchema,
  LIMITS
} from './validation-rules'

// Service name validation
const serviceNameSchema = z.string()
  .trim()
  .min(2, 'Mindestens 2 Zeichen erforderlich')
  .max(LIMITS.SERVICE_NAME_MAX, `Maximal ${LIMITS.SERVICE_NAME_MAX} Zeichen erlaubt`)
  .regex(/^[a-zA-Z0-9äöüÄÖÜàâéèêëïîôùûçÀÂÉÈÊËÏÎÔÙÛÇ\s\-'&.,()]+$/, 'Ungültige Zeichen im Servicenamen')
  .refine(val => !val.includes('  '), 'Keine doppelten Leerzeichen erlaubt')

export const createServiceSchema = z.object({
  name: serviceNameSchema,
  description: shortDescriptionSchema,
  duration: durationSchema,
  price: priceSchema,
  bufferBefore: bufferSchema.default(0),
  bufferAfter: bufferSchema.default(0),
  categoryId: uuidSchema.optional(),
  isActive: z.boolean().default(true),
  employeeIds: z.array(uuidSchema).optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>