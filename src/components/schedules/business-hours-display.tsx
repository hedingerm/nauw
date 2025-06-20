'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { BusinessHoursSelector } from '@/src/components/onboarding/business-hours-selector'
import { Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface BusinessHoursDisplayProps {
  hours: any
  onSave: (hours: any) => void
  editable: boolean
  saving: boolean
}

const WEEKDAYS = [
  { key: 'monday', label: 'Montag', short: 'Mo' },
  { key: 'tuesday', label: 'Dienstag', short: 'Di' },
  { key: 'wednesday', label: 'Mittwoch', short: 'Mi' },
  { key: 'thursday', label: 'Donnerstag', short: 'Do' },
  { key: 'friday', label: 'Freitag', short: 'Fr' },
  { key: 'saturday', label: 'Samstag', short: 'Sa' },
  { key: 'sunday', label: 'Sonntag', short: 'So' },
]

export function BusinessHoursDisplay({ hours, onSave, editable, saving }: BusinessHoursDisplayProps) {
  const [localHours, setLocalHours] = useState(hours)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalHours(hours)
    setHasChanges(false)
  }, [hours])

  const handleSave = () => {
    onSave(localHours)
    setHasChanges(false)
  }

  const handleChange = (newHours: any) => {
    setLocalHours(newHours)
    setHasChanges(true)
  }

  if (editable) {
    return (
      <div className="space-y-4">
        <BusinessHoursSelector
          value={localHours}
          onChange={handleChange}
        />
        {hasChanges && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Read-only display
  return (
    <div className="space-y-2">
      {WEEKDAYS.map(({ key, label, short }) => {
        const dayHours = localHours[key]
        const isOpen = dayHours?.isOpen

        return (
          <div
            key={key}
            className={cn(
              "flex items-center justify-between py-2 px-3 rounded-lg",
              isOpen ? "bg-muted/50" : "opacity-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-28">
                {isOpen ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />
                )}
                <span className={cn("font-medium", !isOpen && "text-muted-foreground")}>
                  {label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {isOpen ? (
                <>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>
                    {dayHours.openTime} - {dayHours.closeTime}
                    {dayHours.hasLunchBreak && (
                      <span className="text-muted-foreground ml-2">
                        (Pause: {dayHours.lunchStart} - {dayHours.lunchEnd})
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Geschlossen</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}