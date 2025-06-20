import { z } from 'zod'

// ============================================
// REGEX PATTERNS - Security focused
// ============================================

// Only letters, spaces, hyphens, apostrophes (for names like Jean-Claude or O'Brien)
export const NAME_PATTERN = /^[a-zA-ZäöüÄÖÜàâéèêëïîôùûçÀÂÉÈÊËÏÎÔÙÛÇ\s\-']+$/

// Alphanumeric with common business chars
export const BUSINESS_NAME_PATTERN = /^[a-zA-Z0-9äöüÄÖÜàâéèêëïîôùûçÀÂÉÈÊËÏÎÔÙÛÇ\s\-'&.,]+$/

// Street address - letters, numbers, spaces, and common address chars
export const ADDRESS_PATTERN = /^[a-zA-Z0-9äöüÄÖÜàâéèêëïîôùûçÀÂÉÈÊËÏÎÔÙÛÇ\s\-'.,/]+$/

// City names - only letters and spaces
export const CITY_PATTERN = /^[a-zA-ZäöüÄÖÜàâéèêëïîôùûçÀÂÉÈÊËÏÎÔÙÛÇ\s\-']+$/

// Swiss postal code - exactly 4 digits
export const SWISS_POSTAL_CODE_PATTERN = /^[1-9]\d{3}$/

// Swiss phone patterns
export const SWISS_PHONE_PATTERN = /^(\+41|0041|0)?[1-9]\d{1,2}[\s]?\d{3}[\s]?\d{2}[\s]?\d{2}$/

// Time format HH:MM
export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

// Hex color code
export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

// URL safe string (for slugs, IDs)
export const URL_SAFE_PATTERN = /^[a-zA-Z0-9\-_]+$/

// No HTML/Script tags
export const NO_HTML_PATTERN = /^[^<>]*$/

// ============================================
// CHARACTER LIMITS - Prevent DB bloat
// ============================================

export const LIMITS = {
  // Names and titles
  NAME_MIN: 2,
  NAME_MAX: 100,
  BUSINESS_NAME_MAX: 150,
  
  // Contact info
  EMAIL_MAX: 255,
  PHONE_MAX: 20,
  
  // Addresses
  ADDRESS_MIN: 5,
  ADDRESS_MAX: 200,
  CITY_MIN: 2,
  CITY_MAX: 50,
  
  // Descriptions and notes
  DESCRIPTION_MAX: 1000,
  SHORT_DESCRIPTION_MAX: 500,
  NOTES_MAX: 500,
  
  // Business specific
  SERVICE_NAME_MAX: 100,
  CATEGORY_NAME_MAX: 50,
  
  // Numeric limits
  PRICE_MAX: 99999.99,
  DURATION_MIN: 5,
  DURATION_MAX: 480, // 8 hours
  BUFFER_MAX: 120, // 2 hours
  
  // Arrays
  MAX_TAGS: 10,
  TAG_LENGTH_MAX: 30,
  
  // Auth
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
}

// ============================================
// REUSABLE VALIDATION SCHEMAS
// ============================================

// Name validation - strict, no numbers or special chars
export const nameSchema = z.string()
  .trim()
  .min(LIMITS.NAME_MIN, `Mindestens ${LIMITS.NAME_MIN} Zeichen erforderlich`)
  .max(LIMITS.NAME_MAX, `Maximal ${LIMITS.NAME_MAX} Zeichen erlaubt`)
  .regex(NAME_PATTERN, 'Nur Buchstaben, Leerzeichen und Bindestriche erlaubt')
  .refine(val => !val.includes('  '), 'Keine doppelten Leerzeichen erlaubt')

// Business name - allows some special chars
export const businessNameSchema = z.string()
  .trim()
  .min(LIMITS.NAME_MIN, `Mindestens ${LIMITS.NAME_MIN} Zeichen erforderlich`)
  .max(LIMITS.BUSINESS_NAME_MAX, `Maximal ${LIMITS.BUSINESS_NAME_MAX} Zeichen erlaubt`)
  .regex(BUSINESS_NAME_PATTERN, 'Ungültige Zeichen enthalten')
  .refine(val => !val.includes('  '), 'Keine doppelten Leerzeichen erlaubt')

// Email validation with length limit
export const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .email('Ungültige E-Mail-Adresse')
  .max(LIMITS.EMAIL_MAX, `Maximal ${LIMITS.EMAIL_MAX} Zeichen erlaubt`)
  .refine(val => !val.includes('..'), 'Ungültiges E-Mail-Format')
  .refine(val => !val.startsWith('.') && !val.endsWith('.'), 'Ungültiges E-Mail-Format')

// Swiss phone validation
export const swissPhoneSchema = z.string()
  .trim()
  .max(LIMITS.PHONE_MAX, `Maximal ${LIMITS.PHONE_MAX} Zeichen erlaubt`)
  .regex(SWISS_PHONE_PATTERN, 'Ungültige Schweizer Telefonnummer (z.B. 079 123 45 67)')
  .transform(val => {
    // Normalize to +41 format
    const cleaned = val.replace(/[\s\-()]/g, '')
    if (cleaned.startsWith('00')) {
      return '+' + cleaned.substring(2)
    }
    if (cleaned.startsWith('0')) {
      return '+41' + cleaned.substring(1)
    }
    if (!cleaned.startsWith('+')) {
      return '+41' + cleaned
    }
    return cleaned
  })

// Address validation
export const addressSchema = z.string()
  .trim()
  .min(LIMITS.ADDRESS_MIN, `Mindestens ${LIMITS.ADDRESS_MIN} Zeichen erforderlich`)
  .max(LIMITS.ADDRESS_MAX, `Maximal ${LIMITS.ADDRESS_MAX} Zeichen erlaubt`)
  .regex(ADDRESS_PATTERN, 'Ungültige Zeichen in der Adresse')
  .refine(val => !val.includes('  '), 'Keine doppelten Leerzeichen erlaubt')

// City validation
export const citySchema = z.string()
  .trim()
  .min(LIMITS.CITY_MIN, `Mindestens ${LIMITS.CITY_MIN} Zeichen erforderlich`)
  .max(LIMITS.CITY_MAX, `Maximal ${LIMITS.CITY_MAX} Zeichen erlaubt`)
  .regex(CITY_PATTERN, 'Nur Buchstaben und Leerzeichen erlaubt')

// Swiss postal code
export const swissPostalCodeSchema = z.string()
  .trim()
  .regex(SWISS_POSTAL_CODE_PATTERN, 'Postleitzahl muss 4 Ziffern haben (1000-9999)')

// Description with HTML prevention
export const descriptionSchema = z.string()
  .trim()
  .max(LIMITS.DESCRIPTION_MAX, `Maximal ${LIMITS.DESCRIPTION_MAX} Zeichen erlaubt`)
  .regex(NO_HTML_PATTERN, 'HTML-Tags sind nicht erlaubt')
  .optional()

// Short description
export const shortDescriptionSchema = z.string()
  .trim()
  .max(LIMITS.SHORT_DESCRIPTION_MAX, `Maximal ${LIMITS.SHORT_DESCRIPTION_MAX} Zeichen erlaubt`)
  .regex(NO_HTML_PATTERN, 'HTML-Tags sind nicht erlaubt')
  .optional()

// Notes field
export const notesSchema = z.string()
  .trim()
  .max(LIMITS.NOTES_MAX, `Maximal ${LIMITS.NOTES_MAX} Zeichen erlaubt`)
  .regex(NO_HTML_PATTERN, 'HTML-Tags sind nicht erlaubt')
  .optional()

// Price validation (Swiss Francs)
export const priceSchema = z.number()
  .min(0, 'Preis kann nicht negativ sein')
  .max(LIMITS.PRICE_MAX, `Maximalpreis: ${LIMITS.PRICE_MAX} CHF`)
  .multipleOf(0.05, 'Preis muss auf 5 Rappen genau sein') // Swiss rounding

// Duration in minutes
export const durationSchema = z.number()
  .int('Dauer muss eine ganze Zahl sein')
  .min(LIMITS.DURATION_MIN, `Mindestdauer: ${LIMITS.DURATION_MIN} Minuten`)
  .max(LIMITS.DURATION_MAX, `Maximaldauer: ${LIMITS.DURATION_MAX} Minuten`)

// Buffer time validation
export const bufferSchema = z.number()
  .int('Pufferzeit muss eine ganze Zahl sein')
  .min(0, 'Pufferzeit kann nicht negativ sein')
  .max(LIMITS.BUFFER_MAX, `Maximale Pufferzeit: ${LIMITS.BUFFER_MAX} Minuten`)

// Time string validation (HH:MM)
export const timeStringSchema = z.string()
  .regex(TIME_PATTERN, 'Ungültiges Zeitformat (HH:MM)')

// Hex color validation
export const hexColorSchema = z.string()
  .regex(HEX_COLOR_PATTERN, 'Ungültiges Farbformat (#RRGGBB)')

// Tag validation
export const tagSchema = z.string()
  .trim()
  .min(1, 'Tag darf nicht leer sein')
  .max(LIMITS.TAG_LENGTH_MAX, `Maximal ${LIMITS.TAG_LENGTH_MAX} Zeichen pro Tag`)
  .regex(/^[a-zA-Z0-9äöüÄÖÜ\s\-]+$/, 'Nur Buchstaben, Zahlen und Bindestriche erlaubt')

// Tags array validation
export const tagsArraySchema = z.array(tagSchema)
  .max(LIMITS.MAX_TAGS, `Maximal ${LIMITS.MAX_TAGS} Tags erlaubt`)
  .optional()

// Date validation (must be valid date)
export const dateSchema = z.string()
  .refine(val => !isNaN(Date.parse(val)), 'Ungültiges Datum')

// Past date validation (for birthdays)
export const pastDateSchema = z.string()
  .refine(val => !isNaN(Date.parse(val)), 'Ungültiges Datum')
  .refine(val => new Date(val) < new Date(), 'Datum muss in der Vergangenheit liegen')
  .refine(val => new Date(val).getFullYear() > 1900, 'Ungültiges Geburtsjahr')

// Future date validation (for appointments)
export const futureDateTimeSchema = z.string()
  .refine(val => !isNaN(Date.parse(val)), 'Ungültiges Datum')
  .refine(val => new Date(val) > new Date(), 'Termin muss in der Zukunft liegen')

// UUID validation
export const uuidSchema = z.string()
  .uuid('Ungültige ID')

// Password validation
export const passwordSchema = z.string()
  .min(LIMITS.PASSWORD_MIN, `Mindestens ${LIMITS.PASSWORD_MIN} Zeichen erforderlich`)
  .max(LIMITS.PASSWORD_MAX, `Maximal ${LIMITS.PASSWORD_MAX} Zeichen erlaubt`)
  .regex(/[A-Z]/, 'Mindestens ein Großbuchstabe erforderlich')
  .regex(/[a-z]/, 'Mindestens ein Kleinbuchstabe erforderlich')
  .regex(/[0-9]/, 'Mindestens eine Zahl erforderlich')
  .regex(/[^A-Za-z0-9]/, 'Mindestens ein Sonderzeichen erforderlich')

// ============================================
// SANITIZATION FUNCTIONS
// ============================================

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/[<>]/g, '') // Remove any remaining angle brackets
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
}

export function sanitizePhone(phone: string): string {
  // Remove all non-numeric except +
  return phone.replace(/[^\d+]/g, '')
}

export function sanitizePostalCode(code: string): string {
  // Keep only digits
  return code.replace(/\D/g, '')
}

// ============================================
// VALIDATION HELPERS
// ============================================

export function isValidSwissPhone(phone: string): boolean {
  const cleaned = sanitizePhone(phone)
  return SWISS_PHONE_PATTERN.test(cleaned)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= LIMITS.EMAIL_MAX
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}