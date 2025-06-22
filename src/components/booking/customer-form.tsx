'use client'

import { useState, useEffect } from 'react'
import { CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Checkbox } from '@/src/components/ui/checkbox'
import { formatPhoneInput, getSwissPhonePlaceholder, isValidSwissPhone } from '@/src/lib/utils/normalize'
import { isValidEmail } from '@/src/lib/schemas/validation-rules'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'

export interface CustomerFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  notes: string
}

interface CustomerFormProps {
  customerData: CustomerFormData
  marketingConsent: boolean
  config: BookingPageConfig | null
  onCustomerDataChange: (data: CustomerFormData) => void
  onMarketingConsentChange: (consent: boolean) => void
}

interface ValidationErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  notes?: string
}

export function CustomerForm({
  customerData,
  marketingConsent,
  config,
  onCustomerDataChange,
  onMarketingConsentChange
}: CustomerFormProps) {
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Validation functions
  const validateName = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Dieses Feld ist erforderlich'
    }
    if (value.length < 2) {
      return 'Mindestens 2 Zeichen erforderlich'
    }
    if (value.length > 100) {
      return 'Maximal 100 Zeichen erlaubt'
    }
    // Check for valid name pattern (letters, spaces, hyphens, apostrophes)
    const namePattern = /^[a-zA-ZäöüÄÖÜàâéèêëïîôùûçÀÂÉÈÊËÏÎÔÙÛÇ\s\-']+$/
    if (!namePattern.test(value)) {
      return 'Nur Buchstaben, Leerzeichen und Bindestriche erlaubt'
    }
    return undefined
  }

  const validateEmail = (value: string): string | undefined => {
    if (!value) return undefined // Email is optional
    if (!isValidEmail(value)) {
      return 'Ungültige E-Mail-Adresse'
    }
    return undefined
  }

  const validatePhone = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Dieses Feld ist erforderlich'
    }
    if (!isValidSwissPhone(value)) {
      return 'Ungültige Schweizer Telefonnummer (z.B. 079 123 45 67)'
    }
    return undefined
  }

  // Validate all fields on data change
  useEffect(() => {
    const validateNotes = (value: string): string | undefined => {
      if (config?.content.requireNotes && !value.trim()) {
        return 'Dieses Feld ist erforderlich'
      }
      if (value.length > 500) {
        return 'Maximal 500 Zeichen erlaubt'
      }
      return undefined
    }

    const newErrors: ValidationErrors = {}
    
    if (touched.firstName) {
      const firstNameError = validateName(customerData.firstName)
      if (firstNameError) newErrors.firstName = firstNameError
    }
    
    if (touched.lastName) {
      const lastNameError = validateName(customerData.lastName)
      if (lastNameError) newErrors.lastName = lastNameError
    }
    
    if (touched.email) {
      const emailError = validateEmail(customerData.email)
      if (emailError) newErrors.email = emailError
    }
    
    if (touched.phone && config?.features.requirePhone) {
      const phoneError = validatePhone(customerData.phone)
      if (phoneError) newErrors.phone = phoneError
    }
    
    if (touched.notes) {
      const notesError = validateNotes(customerData.notes)
      if (notesError) newErrors.notes = notesError
    }
    
    setErrors(newErrors)
  }, [customerData, touched, config])

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    onCustomerDataChange({
      ...customerData,
      [field]: value
    })
  }

  const handleBlur = (field: keyof CustomerFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value)
    handleInputChange('phone', formatted)
  }

  return (
    <div>
      <CardHeader className="px-0 pt-0">
        <CardTitle>Ihre Kontaktdaten</CardTitle>
        <CardDescription>
          Bitte geben Sie Ihre Kontaktinformationen ein
        </CardDescription>
      </CardHeader>

      <div className="space-y-4 mt-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Vorname *</Label>
            <Input
              id="firstName"
              value={customerData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              onBlur={() => handleBlur('firstName')}
              placeholder="Max"
              className={errors.firstName ? 'border-destructive' : ''}
            />
            {errors.firstName && touched.firstName && (
              <p className="text-sm text-destructive">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nachname *</Label>
            <Input
              id="lastName"
              value={customerData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              onBlur={() => handleBlur('lastName')}
              placeholder="Mustermann"
              className={errors.lastName ? 'border-destructive' : ''}
            />
            {errors.lastName && touched.lastName && (
              <p className="text-sm text-destructive">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-Mail (optional)</Label>
          <Input
            id="email"
            type="email"
            value={customerData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="max@example.com"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && touched.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {config?.features.requirePhone && (
          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer *</Label>
            <Input
              id="phone"
              type="tel"
              value={customerData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => handleBlur('phone')}
              placeholder={getSwissPhonePlaceholder()}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && touched.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
            {!errors.phone && (
              <p className="text-xs text-muted-foreground">
                Sie können die Nummer in jedem Format eingeben: 079 123 45 67, 0791234567, +41791234567
              </p>
            )}
          </div>
        )}

        {config?.features.allowCustomerNotes && (
          <div className="space-y-2">
            <Label htmlFor="notes">
              {config?.content.notesLabel || 'Anmerkungen'} 
              {config?.content.requireNotes ? ' *' : ' (optional)'}
            </Label>
            <Textarea
              id="notes"
              value={customerData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              onBlur={() => handleBlur('notes')}
              placeholder={config?.content.notesLabel || "Besondere Wünsche oder Anmerkungen..."}
              rows={3}
              className={errors.notes ? 'border-destructive' : ''}
            />
            {errors.notes && touched.notes && (
              <p className="text-sm text-destructive">{errors.notes}</p>
            )}
          </div>
        )}

        {config?.features.showMarketingConsent && (
          <div className="flex items-start space-x-3">
            <Checkbox
              id="marketing"
              checked={marketingConsent}
              onCheckedChange={(checked) => onMarketingConsentChange(checked as boolean)}
              className="border-gray-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
              style={{
                ...(marketingConsent && {
                  backgroundColor: config?.theme.primaryColor || '#2563eb',
                  borderColor: config?.theme.primaryColor || '#2563eb',
                })
              }}
            />
            <Label htmlFor="marketing" className="text-sm cursor-pointer">
              Ich möchte über Neuigkeiten und Angebote informiert werden
            </Label>
          </div>
        )}
      </div>
    </div>
  )
}