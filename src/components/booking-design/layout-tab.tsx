'use client'

import { Label } from '@/src/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { SwitchEnhanced as Switch } from '@/src/components/ui/switch-enhanced'
import { Slider } from '@/src/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'

interface LayoutTabProps {
  config: BookingPageConfig
  onUpdate: (updates: Partial<BookingPageConfig>) => void
}

export function LayoutTab({ config, onUpdate }: LayoutTabProps) {
  const handleLayoutChange = (field: keyof typeof config.layout, value: any) => {
    onUpdate({
      layout: {
        ...config.layout,
        [field]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Service Display */}
      <Card>
        <CardHeader>
          <CardTitle>Service-Anzeige</CardTitle>
          <CardDescription>
            Wie sollen Ihre Services dargestellt werden?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Layout-Stil</Label>
            <RadioGroup
              value={config.layout.serviceLayout}
              onValueChange={(value: any) => handleLayoutChange('serviceLayout', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grid" id="grid" />
                <Label htmlFor="grid" className="font-normal">
                  Kacheln (Grid-Ansicht)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="list" id="list" />
                <Label htmlFor="list" className="font-normal">
                  Liste (Kompakte Ansicht)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showCategories">Kategorien anzeigen</Label>
              <p className="text-sm text-muted-foreground">
                Services nach Kategorien gruppieren
              </p>
            </div>
            <Switch
              id="showCategories"
              checked={config.layout.showCategories}
              onCheckedChange={(checked) => handleLayoutChange('showCategories', checked)}
            />
          </div>

          {config.layout.showCategories && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="categoriesExpanded">Kategorien standardmäßig ausgeklappt</Label>
                <p className="text-sm text-muted-foreground">
                  Alle Kategorien beim Laden der Seite öffnen
                </p>
              </div>
              <Switch
                id="categoriesExpanded"
                checked={config.layout.categoriesExpanded}
                onCheckedChange={(checked) => handleLayoutChange('categoriesExpanded', checked)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Mitarbeiterauswahl</CardTitle>
          <CardDescription>
            Sollen Kunden einen Mitarbeiter auswählen können?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showEmployeeSelection">Mitarbeiterauswahl anzeigen</Label>
              <p className="text-sm text-muted-foreground">
                Kunden können ihren bevorzugten Mitarbeiter wählen
              </p>
            </div>
            <Switch
              id="showEmployeeSelection"
              checked={config.layout.showEmployeeSelection}
              onCheckedChange={(checked) => handleLayoutChange('showEmployeeSelection', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Calendar Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Kalender-Einstellungen</CardTitle>
          <CardDescription>
            Konfigurieren Sie die Terminauswahl
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calendarView">Kalenderansicht</Label>
            <Select
              value={config.layout.calendarView}
              onValueChange={(value) => handleLayoutChange('calendarView', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monatsansicht</SelectItem>
                <SelectItem value="week">Wochenansicht</SelectItem>
                <SelectItem value="list">Listenansicht (nur verfügbare Tage)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeSlotInterval">Zeitslot-Intervall</Label>
            <Select
              value={config.layout.timeSlotInterval.toString()}
              onValueChange={(value) => handleLayoutChange('timeSlotInterval', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 Minuten</SelectItem>
                <SelectItem value="30">30 Minuten</SelectItem>
                <SelectItem value="60">60 Minuten</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Wie sollen die verfügbaren Zeiten gruppiert werden?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxAdvanceBookingDays">Maximale Vorausbuchung</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="maxAdvanceBookingDays"
                min={7}
                max={90}
                step={1}
                value={[config.layout.maxAdvanceBookingDays]}
                onValueChange={([value]: number[]) => handleLayoutChange('maxAdvanceBookingDays', value)}
                className="flex-1"
              />
              <span className="w-20 text-sm font-medium">
                {config.layout.maxAdvanceBookingDays} Tage
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Wie weit im Voraus können Kunden Termine buchen?
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}