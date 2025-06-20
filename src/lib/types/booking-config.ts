// Type definitions for BookingPageConfig JSON fields

export interface BookingPageTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  borderRadius: 'none' | 'small' | 'medium' | 'large'
  darkMode: boolean
}

export interface BookingPageLayout {
  serviceLayout: 'grid' | 'list'
  showCategories: boolean
  categoriesExpanded: boolean
  showEmployeeSelection: boolean
  calendarView: 'month' | 'week' | 'list'
  timeSlotInterval: 15 | 30 | 60
  maxAdvanceBookingDays: number
}

export interface BookingPageContent {
  welcomeTitle: string
  welcomeText: string
  successMessage: string
  requireNotes: boolean
  notesLabel: string
  showSocialLinks: boolean
  socialLinks: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
    youtube?: string
    tiktok?: string
    website?: string
  }
}

export interface BookingPageFeatures {
  showPrices: boolean
  showDuration: boolean
  showEmployeeNames: boolean
  allowCustomerNotes: boolean
  requirePhone: boolean
  showMarketingConsent: boolean
  enableOnlinePayment: boolean
  sendConfirmationEmail: boolean
  sendReminderEmail: boolean
}

export interface BookingPageSEO {
  title: string
  description: string
  keywords: string[]
}

export interface BookingPageConfig {
  id: string
  businessId: string
  theme: BookingPageTheme
  layout: BookingPageLayout
  content: BookingPageContent
  features: BookingPageFeatures
  customCSS: string
  logoUrl: string | null
  coverImageUrl: string | null
  faviconUrl: string | null
  seo: BookingPageSEO
  createdAt: string
  updatedAt: string
}

// Default values for new configs
export const defaultTheme: BookingPageTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  fontFamily: 'Inter',
  borderRadius: 'medium',
  darkMode: false,
}

export const defaultLayout: BookingPageLayout = {
  serviceLayout: 'grid',
  showCategories: true,
  categoriesExpanded: false,
  showEmployeeSelection: true,
  calendarView: 'month',
  timeSlotInterval: 30,
  maxAdvanceBookingDays: 60,
}

export const defaultContent: BookingPageContent = {
  welcomeTitle: 'Termin buchen',
  welcomeText: '',
  successMessage: 'Vielen Dank für Ihre Buchung!',
  requireNotes: false,
  notesLabel: 'Anmerkungen',
  showSocialLinks: true,
  socialLinks: {},
}

export const defaultFeatures: BookingPageFeatures = {
  showPrices: true,
  showDuration: true,
  showEmployeeNames: true,
  allowCustomerNotes: true,
  requirePhone: true,
  showMarketingConsent: false,
  enableOnlinePayment: false,
  sendConfirmationEmail: true,
  sendReminderEmail: true,
}

export const defaultSEO: BookingPageSEO = {
  title: '',
  description: '',
  keywords: [],
}

// Theme presets for different business types
export const themePresets = {
  modern: {
    name: 'Modern',
    theme: {
      ...defaultTheme,
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      borderRadius: 'medium' as const,
    },
  },
  elegant: {
    name: 'Elegant',
    theme: {
      ...defaultTheme,
      primaryColor: '#1e293b',
      secondaryColor: '#475569',
      accentColor: '#d97706',
      borderRadius: 'small' as const,
      fontFamily: 'Playfair Display',
    },
  },
  fresh: {
    name: 'Frisch',
    theme: {
      ...defaultTheme,
      primaryColor: '#10b981',
      secondaryColor: '#6ee7b7',
      accentColor: '#3b82f6',
      borderRadius: 'large' as const,
    },
  },
  professional: {
    name: 'Professionell',
    theme: {
      ...defaultTheme,
      primaryColor: '#0f172a',
      secondaryColor: '#334155',
      accentColor: '#0ea5e9',
      borderRadius: 'none' as const,
      fontFamily: 'Arial',
    },
  },
  warm: {
    name: 'Warm',
    theme: {
      ...defaultTheme,
      primaryColor: '#dc2626',
      secondaryColor: '#f87171',
      accentColor: '#f59e0b',
      borderRadius: 'medium' as const,
    },
  },
}