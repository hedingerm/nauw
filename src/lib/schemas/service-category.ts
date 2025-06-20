import { z } from 'zod'

export const createServiceCategorySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name darf maximal 100 Zeichen lang sein'),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).default(0),
})

export const updateServiceCategorySchema = createServiceCategorySchema.partial()

export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>
export type UpdateServiceCategoryInput = z.infer<typeof updateServiceCategorySchema>