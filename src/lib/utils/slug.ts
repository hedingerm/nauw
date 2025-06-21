/**
 * Generate a URL-friendly slug from a text string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 50) // Limit length
}

/**
 * Generate a unique slug by appending a suffix
 */
export function generateUniqueSlug(baseSlug: string, suffix: string): string {
  const cleanSuffix = suffix.replace(/[^a-z0-9]/g, '').slice(0, 8)
  return `${baseSlug}-${cleanSuffix}`.slice(0, 50)
}