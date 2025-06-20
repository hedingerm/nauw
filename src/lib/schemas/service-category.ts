import { z } from 'zod'
import {
  shortDescriptionSchema,
  LIMITS,
  sanitizeInput
} from './validation-rules'

// Category name validation
const categoryNameSchema = z.string()
  .trim()
  .min(1, 'Name ist erforderlich')
  .max(LIMITS.CATEGORY_NAME_MAX, `Maximal ${LIMITS.CATEGORY_NAME_MAX} Zeichen erlaubt`)
  .regex(/^[a-zA-Z0-9äöüÄÖÜàâéèêëïîôùûçÀÂÉÈÊËÏÎÔÙÛÇ\s\-&]+$/, 'Ungültige Zeichen im Kategorienamen')
  .refine(val => !val.includes('  '), 'Keine doppelten Leerzeichen erlaubt')
  .transform(sanitizeInput)

export const createServiceCategorySchema = z.object({
  name: categoryNameSchema,
  description: shortDescriptionSchema,
  displayOrder: z.number()
    .int('Anzeigereihenfolge muss eine ganze Zahl sein')
    .min(0, 'Anzeigereihenfolge kann nicht negativ sein')
    .max(999, 'Maximal 999 als Anzeigereihenfolge')
    .default(0),
})

export const updateServiceCategorySchema = createServiceCategorySchema.partial()

export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>
export type UpdateServiceCategoryInput = z.infer<typeof updateServiceCategorySchema>