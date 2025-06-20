import { z } from 'zod'
import {
  nameSchema,
  emailSchema,
  swissPhoneSchema,
  timeStringSchema,
  uuidSchema,
  LIMITS
} from './validation-rules'

// Employee working hours with lunch break validation
const dayWorkingHoursSchema = z.object({
  start: timeStringSchema,
  end: timeStringSchema,
  hasLunchBreak: z.boolean().optional(),
  lunchStart: timeStringSchema.optional(),
  lunchEnd: timeStringSchema.optional(),
}).refine(
  (data) => {
    const start = parseInt(data.start.replace(':', ''))
    const end = parseInt(data.end.replace(':', ''))
    
    // Validate main hours
    if (start >= end) return false
    
    // Validate lunch break if present
    if (data.hasLunchBreak && data.lunchStart && data.lunchEnd) {
      const lunchStart = parseInt(data.lunchStart.replace(':', ''))
      const lunchEnd = parseInt(data.lunchEnd.replace(':', ''))
      
      // Lunch must be within working hours
      if (lunchStart < start || lunchEnd > end) return false
      // Lunch start must be before lunch end
      if (lunchStart >= lunchEnd) return false
    }
    
    return true
  },
  { message: 'Ungültige Arbeitszeiten oder Pausenzeiten' }
).optional()

export const workingHoursSchema = z.object({
  monday: dayWorkingHoursSchema,
  tuesday: dayWorkingHoursSchema,
  wednesday: dayWorkingHoursSchema,
  thursday: dayWorkingHoursSchema,
  friday: dayWorkingHoursSchema,
  saturday: dayWorkingHoursSchema,
  sunday: dayWorkingHoursSchema,
})

// Role validation
const roleSchema = z.string()
  .min(1, 'Rolle ist erforderlich')
  .max(50, 'Maximal 50 Zeichen erlaubt')
  .regex(/^[a-zA-Z0-9äöüÄÖÜ\s\-]+$/, 'Ungültige Zeichen in der Rolle')

export const createEmployeeSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: swissPhoneSchema.optional(),
  role: roleSchema.optional(),
  workingHours: workingHoursSchema,
  serviceIds: z.array(uuidSchema)
    .max(50, 'Maximal 50 Services pro Mitarbeiter')
    .optional(),
})

export const updateEmployeeSchema = createEmployeeSchema.partial()

export type WorkingHours = z.infer<typeof workingHoursSchema>
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>