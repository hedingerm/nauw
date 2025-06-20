import { z } from 'zod'
import {
  businessNameSchema,
  emailSchema,
  swissPhoneSchema,
  addressSchema,
  citySchema,
  swissPostalCodeSchema,
  descriptionSchema,
  timeStringSchema,
  nameSchema,
  durationSchema,
  priceSchema,
  bufferSchema,
  uuidSchema,
  LIMITS
} from './validation-rules'

// Business type validation
const businessTypeSchema = z.string()
  .min(1, 'Bitte wählen Sie einen Geschäftstyp')
  .max(50, 'Maximal 50 Zeichen erlaubt')
  .regex(/^[a-zA-Z0-9äöüÄÖÜ\s\-&]+$/, 'Ungültige Zeichen im Geschäftstyp')

// Business Information Schema (Step 1)
export const businessInfoSchema = z.object({
  name: businessNameSchema,
  type: businessTypeSchema,
  phone: swissPhoneSchema,
  email: emailSchema,
  street: addressSchema,
  city: citySchema,
  postalCode: swissPostalCodeSchema,
  country: z.string()
    .min(1, 'Land ist erforderlich')
    .max(50, 'Maximal 50 Zeichen erlaubt')
    .default('Schweiz'),
  description: descriptionSchema,
})

// Business Hours Schema (Step 2)
const dayScheduleSchema = z.object({
  isOpen: z.boolean(),
  openTime: timeStringSchema,
  closeTime: timeStringSchema,
  hasLunchBreak: z.boolean().optional(),
  lunchStart: timeStringSchema.optional(),
  lunchEnd: timeStringSchema.optional(),
}).refine(
  (data) => {
    if (!data.isOpen) return true
    
    const open = parseInt(data.openTime.replace(':', ''))
    const close = parseInt(data.closeTime.replace(':', ''))
    
    // Validate main hours
    if (open >= close) return false
    
    // Validate lunch break if present
    if (data.hasLunchBreak && data.lunchStart && data.lunchEnd) {
      const lunchStart = parseInt(data.lunchStart.replace(':', ''))
      const lunchEnd = parseInt(data.lunchEnd.replace(':', ''))
      
      // Lunch must be within working hours
      if (lunchStart < open || lunchEnd > close) return false
      // Lunch start must be before lunch end
      if (lunchStart >= lunchEnd) return false
    }
    
    return true
  },
  { message: 'Ungültige Geschäftszeiten oder Pausenzeiten' }
)

export const businessHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
})

// Role validation
const roleSchema = z.string()
  .min(1, 'Rolle ist erforderlich')
  .max(50, 'Maximal 50 Zeichen erlaubt')
  .regex(/^[a-zA-Z0-9äöüÄÖÜ\s\-]+$/, 'Ungültige Zeichen in der Rolle')
  .default('Inhaber')

// Owner/Employee Schema (Step 3 & 4)
export const employeeInfoSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: swissPhoneSchema,
  role: roleSchema,
  canPerformServices: z.boolean().default(true),
  workingHours: businessHoursSchema.optional(),
})

// Service name validation for onboarding
const serviceNameSchema = z.string()
  .trim()
  .min(2, 'Mindestens 2 Zeichen erforderlich')
  .max(LIMITS.SERVICE_NAME_MAX, `Maximal ${LIMITS.SERVICE_NAME_MAX} Zeichen erlaubt`)
  .regex(/^[a-zA-Z0-9äöüÄÖÜàâéèêëïîôùûçÀÂÉÈÊËÏÎÔÙÛÇ\s\-'&.,()]+$/, 'Ungültige Zeichen im Servicenamen')

// Service Schema (Step 5)
export const serviceInfoSchema = z.object({
  name: serviceNameSchema,
  duration: durationSchema,
  price: priceSchema,
  bufferBefore: bufferSchema.default(0),
  bufferAfter: bufferSchema.default(0),
  description: descriptionSchema,
  employeeIds: z.array(uuidSchema)
    .min(1, 'Bitte wählen Sie mindestens einen Mitarbeiter')
    .max(20, 'Maximal 20 Mitarbeiter pro Service'),
})

// Combined Onboarding Schema
export const completeOnboardingSchema = z.object({
  business: businessInfoSchema.merge(z.object({
    businessHours: businessHoursSchema,
  })),
  owner: employeeInfoSchema,
  additionalEmployee: employeeInfoSchema.optional(),
  service: serviceInfoSchema.optional(),
})

export type BusinessInfo = z.infer<typeof businessInfoSchema>
export type BusinessHours = z.infer<typeof businessHoursSchema>
export type EmployeeInfo = z.infer<typeof employeeInfoSchema>
export type ServiceInfo = z.infer<typeof serviceInfoSchema>
export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>