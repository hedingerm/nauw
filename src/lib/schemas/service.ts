import { z } from 'zod'

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional(),
  duration: z.number().min(5, 'Dauer muss mindestens 5 Minuten betragen'),
  price: z.number().min(0, 'Preis kann nicht negativ sein'),
  bufferBefore: z.number().min(0),
  bufferAfter: z.number().min(0),
  categoryId: z.string().optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>