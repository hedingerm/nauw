import { z } from 'zod'

// Business Information Schema (Step 1)
export const businessInfoSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  type: z.string().min(1, 'Bitte wählen Sie einen Geschäftstyp'),
  phone: z.string().min(10, 'Bitte geben Sie eine gültige Telefonnummer ein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  street: z.string().min(1, 'Straße ist erforderlich'),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  postalCode: z.string().regex(/^\d{4}$/, 'Postleitzahl muss 4 Ziffern haben'),
  country: z.string().default('Schweiz'),
  description: z.string().optional(),
})

// Business Hours Schema (Step 2)
const dayScheduleSchema = z.object({
  isOpen: z.boolean(),
  openTime: z.string(),
  closeTime: z.string(),
  hasLunchBreak: z.boolean().optional(),
  lunchStart: z.string().optional(),
  lunchEnd: z.string().optional(),
})

export const businessHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
})

// Owner/Employee Schema (Step 3 & 4)
export const employeeInfoSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().min(10, 'Bitte geben Sie eine gültige Telefonnummer ein'),
  role: z.string().default('Inhaber'),
  canPerformServices: z.boolean().default(true),
  workingHours: businessHoursSchema.optional(),
})

// Service Schema (Step 5)
export const serviceInfoSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  duration: z.number().min(15, 'Mindestdauer ist 15 Minuten'),
  price: z.number().min(0, 'Preis kann nicht negativ sein'),
  bufferBefore: z.number().min(0).default(0),
  bufferAfter: z.number().min(0).default(0),
  description: z.string().optional(),
  employeeIds: z.array(z.string()).min(1, 'Bitte wählen Sie mindestens einen Mitarbeiter'),
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