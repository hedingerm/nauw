'use client'

import { Label } from '@/src/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { SwitchEnhanced as Switch } from '@/src/components/ui/switch-enhanced'
import { Badge } from '@/src/components/ui/badge'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'

interface FeaturesTabProps {
  config: BookingPageConfig
  onUpdate: (updates: Partial<BookingPageConfig>) => void
}

export function FeaturesTab({ config, onUpdate }: FeaturesTabProps) {
  const handleFeatureChange = (feature: keyof typeof config.features, enabled: boolean) => {
    onUpdate({
      features: {
        ...config.features,
        [feature]: enabled,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Anzeigeoptionen</CardTitle>
          <CardDescription>
            Wählen Sie, welche Informationen auf der Buchungsseite angezeigt werden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showPrices">Preise anzeigen</Label>
              <p className="text-sm text-muted-foreground">
                Service-Preise für Kunden sichtbar machen
              </p>
            </div>
            <Switch
              id="showPrices"
              checked={config.features.showPrices}
              onCheckedChange={(checked) => handleFeatureChange('showPrices', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showDuration">Dauer anzeigen</Label>
              <p className="text-sm text-muted-foreground">
                Service-Dauer für Kunden sichtbar machen
              </p>
            </div>
            <Switch
              id="showDuration"
              checked={config.features.showDuration}
              onCheckedChange={(checked) => handleFeatureChange('showDuration', checked)}
            />
          </div>

        </CardContent>
      </Card>

      {/* Customer Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Kundenanforderungen</CardTitle>
          <CardDescription>
            Welche Informationen müssen Kunden angeben?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requirePhone">Telefonnummer erforderlich</Label>
              <p className="text-sm text-muted-foreground">
                Kunden müssen eine Telefonnummer angeben
              </p>
            </div>
            <Switch
              id="requirePhone"
              checked={config.features.requirePhone}
              onCheckedChange={(checked) => handleFeatureChange('requirePhone', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowCustomerNotes">Kundennotizen erlauben</Label>
              <p className="text-sm text-muted-foreground">
                Kunden können besondere Wünsche angeben
              </p>
            </div>
            <Switch
              id="allowCustomerNotes"
              checked={config.features.allowCustomerNotes}
              onCheckedChange={(checked) => handleFeatureChange('allowCustomerNotes', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showMarketingConsent">Marketing-Einwilligung anzeigen</Label>
              <p className="text-sm text-muted-foreground">
                Checkbox für Newsletter-Anmeldung
              </p>
            </div>
            <Switch
              id="showMarketingConsent"
              checked={config.features.showMarketingConsent}
              onCheckedChange={(checked) => handleFeatureChange('showMarketingConsent', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle>Zahlungsoptionen</CardTitle>
          <CardDescription>
            Konfigurieren Sie die Zahlungsabwicklung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableOnlinePayment">Online-Zahlung aktivieren</Label>
              <p className="text-sm text-muted-foreground">
                Kunden können direkt bei der Buchung bezahlen
              </p>
              <Badge variant="secondary" className="mt-1">Kommt bald</Badge>
            </div>
            <Switch
              id="enableOnlinePayment"
              checked={config.features.enableOnlinePayment}
              onCheckedChange={(checked) => handleFeatureChange('enableOnlinePayment', checked)}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Communication */}
      <Card>
        <CardHeader>
          <CardTitle>Kommunikation</CardTitle>
          <CardDescription>
            Automatische E-Mails und Benachrichtigungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sendConfirmationEmail">Bestätigungs-E-Mail senden</Label>
              <p className="text-sm text-muted-foreground">
                Automatische E-Mail nach erfolgreicher Buchung
              </p>
            </div>
            <Switch
              id="sendConfirmationEmail"
              checked={config.features.sendConfirmationEmail}
              onCheckedChange={(checked) => handleFeatureChange('sendConfirmationEmail', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sendReminderEmail">Erinnerungs-E-Mail senden</Label>
              <p className="text-sm text-muted-foreground">
                E-Mail 24 Stunden vor dem Termin
              </p>
              <Badge variant="secondary" className="mt-1">Kommt bald</Badge>
            </div>
            <Switch
              id="sendReminderEmail"
              checked={config.features.sendReminderEmail}
              onCheckedChange={(checked) => handleFeatureChange('sendReminderEmail', checked)}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Erweiterte Einstellungen</CardTitle>
          <CardDescription>
            Zusätzliche Optionen für fortgeschrittene Nutzer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Weitere erweiterte Einstellungen wie reCAPTCHA-Schutz, IP-Beschränkungen und 
              benutzerdefinierte Webhooks werden in zukünftigen Updates verfügbar sein.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}