'use client'

import { CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Checkbox } from '@/src/components/ui/checkbox'
import { formatPhoneInput, getSwissPhonePlaceholder } from '@/src/lib/utils/normalize'
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

export function CustomerForm({
  customerData,
  marketingConsent,
  config,
  onCustomerDataChange,
  onMarketingConsentChange
}: CustomerFormProps) {
  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    onCustomerDataChange({
      ...customerData,
      [field]: value
    })
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
              placeholder="Max"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nachname *</Label>
            <Input
              id="lastName"
              value={customerData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Mustermann"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-Mail *</Label>
          <Input
            id="email"
            type="email"
            value={customerData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="max@example.com"
            required
          />
        </div>

        {config?.features.requirePhone && (
          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer *</Label>
            <Input
              id="phone"
              type="tel"
              value={customerData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder={getSwissPhonePlaceholder()}
              required
            />
            <p className="text-xs text-muted-foreground">
              Sie können die Nummer in jedem Format eingeben: 079 123 45 67, 0791234567, +41791234567
            </p>
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
              placeholder={config?.content.notesLabel || "Besondere Wünsche oder Anmerkungen..."}
              rows={3}
              required={config?.content.requireNotes}
            />
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