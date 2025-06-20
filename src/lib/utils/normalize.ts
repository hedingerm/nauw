/**
 * Normalize an email address for consistent storage and comparison
 * @param email - The email address to normalize
 * @returns Normalized email address (lowercase, trimmed)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Normalize a phone number for consistent storage and comparison
 * @param phone - The phone number to normalize
 * @returns Normalized phone number (no spaces, consistent format)
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  // Remove all spaces, dashes, dots, parentheses, and other formatting
  let normalized = phone.replace(/[\s\-\.\(\)\/]/g, '')
  
  // Handle various Swiss number formats
  if (normalized.startsWith('0041')) {
    // International format with 00
    normalized = '+41' + normalized.substring(4)
  } else if (normalized.startsWith('+41')) {
    // Already in correct format, just ensure no issues
    normalized = '+41' + normalized.substring(3)
  } else if (normalized.startsWith('41') && normalized.length >= 11) {
    // Country code without plus (check length to avoid false positives)
    normalized = '+41' + normalized.substring(2)
  } else if (normalized.startsWith('0') && normalized.length >= 10) {
    // Swiss number with leading 0
    normalized = '+41' + normalized.substring(1)
  } else if (normalized.match(/^[1-9]\d{8}$/)) {
    // Swiss number without any prefix (9 digits starting with non-zero)
    normalized = '+41' + normalized
  }
  
  // Validate the result is a valid Swiss number
  if (normalized.startsWith('+41')) {
    const numberPart = normalized.substring(3)
    // Swiss numbers should be 9 digits after country code
    if (numberPart.length !== 9 || !numberPart.match(/^\d+$/)) {
      // If invalid, return the original normalized string
      return normalized
    }
  }
  
  return normalized
}

/**
 * Format a normalized phone number for display
 * @param phone - The normalized phone number
 * @returns Formatted phone number for display
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  
  // Format Swiss numbers
  if (normalized.startsWith('+41')) {
    const number = normalized.substring(3)
    if (number.length === 9) {
      return `+41 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5, 7)} ${number.substring(7)}`
    }
  }
  
  return normalized
}

/**
 * Compare two phone numbers for equality
 * @param phone1 - First phone number
 * @param phone2 - Second phone number
 * @returns True if the phone numbers are the same
 */
export function phonesEqual(phone1: string | null | undefined, phone2: string | null | undefined): boolean {
  const normalized1 = normalizePhone(phone1)
  const normalized2 = normalizePhone(phone2)
  
  if (!normalized1 || !normalized2) {
    return normalized1 === normalized2
  }
  
  return normalized1 === normalized2
}

/**
 * Validate if a phone number is a valid Swiss number
 * @param phone - The phone number to validate
 * @returns True if the phone number is valid
 */
export function isValidSwissPhone(phone: string | null | undefined): boolean {
  if (!phone) return false
  
  const normalized = normalizePhone(phone)
  if (!normalized) return false
  
  // Check if it's a valid Swiss number format
  if (!normalized.startsWith('+41')) return false
  
  const numberPart = normalized.substring(3)
  
  // Swiss mobile numbers typically start with 7x
  // Swiss landlines start with other digits
  // All should be 9 digits
  if (numberPart.length !== 9) return false
  if (!numberPart.match(/^\d+$/)) return false
  
  return true
}

/**
 * Get a placeholder text for Swiss phone input
 * @returns Placeholder text
 */
export function getSwissPhonePlaceholder(): string {
  return '079 123 45 67'
}

/**
 * Format phone input as user types
 * @param value - The input value
 * @returns Formatted value for display
 */
export function formatPhoneInput(value: string): string {
  // Remove all non-digits
  let digits = value.replace(/\D/g, '')
  
  // If starts with 41, add + prefix
  if (digits.startsWith('41') && !value.startsWith('+')) {
    digits = '+' + digits
  }
  
  // If starts with 0041, convert to +41
  if (digits.startsWith('0041')) {
    digits = '+41' + digits.substring(4)
  }
  
  // Format based on length
  if (digits.startsWith('+41')) {
    const numberPart = digits.substring(3)
    if (numberPart.length > 2 && numberPart.length <= 5) {
      return `+41 ${numberPart.substring(0, 2)} ${numberPart.substring(2)}`
    } else if (numberPart.length > 5 && numberPart.length <= 7) {
      return `+41 ${numberPart.substring(0, 2)} ${numberPart.substring(2, 5)} ${numberPart.substring(5)}`
    } else if (numberPart.length > 7) {
      return `+41 ${numberPart.substring(0, 2)} ${numberPart.substring(2, 5)} ${numberPart.substring(5, 7)} ${numberPart.substring(7, 9)}`
    }
  } else if (digits.startsWith('0')) {
    if (digits.length > 3 && digits.length <= 6) {
      return `${digits.substring(0, 3)} ${digits.substring(3)}`
    } else if (digits.length > 6 && digits.length <= 8) {
      return `${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`
    } else if (digits.length > 8) {
      return `${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`
    }
  }
  
  return value
}