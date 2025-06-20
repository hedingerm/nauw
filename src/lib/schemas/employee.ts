import { z } from 'zod'

const dayWorkingHoursSchema = z.object({
  start: z.string(),
  end: z.string(),
  hasLunchBreak: z.boolean().optional(),
  lunchStart: z.string().optional(),
  lunchEnd: z.string().optional(),
}).optional()

export const workingHoursSchema = z.object({
  monday: dayWorkingHoursSchema,
  tuesday: dayWorkingHoursSchema,
  wednesday: dayWorkingHoursSchema,
  thursday: dayWorkingHoursSchema,
  friday: dayWorkingHoursSchema,
  saturday: dayWorkingHoursSchema,
  sunday: dayWorkingHoursSchema,
})

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().optional(),
  workingHours: workingHoursSchema,
  serviceIds: z.array(z.string()).optional(),
})

export const updateEmployeeSchema = createEmployeeSchema.partial()

export type WorkingHours = z.infer<typeof workingHoursSchema>
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>