'use client'

import { useState } from 'react'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'

export interface EmployeeHours {
  [key: string]: {
    start?: string
    end?: string
    hasLunchBreak?: boolean
    lunchStart?: string
    lunchEnd?: string
  } | undefined
}

const WEEKDAYS = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
  { key: 'saturday', label: 'Samstag' },
  { key: 'sunday', label: 'Sonntag' },
]

interface EmployeeHoursSelectorProps {
  value: EmployeeHours
  onChange: (hours: EmployeeHours) => void
  businessHours?: any // Business hours to show as reference
}

export function EmployeeHoursSelector({ value, onChange, businessHours }: EmployeeHoursSelectorProps) {
  const [hours, setHours] = useState<EmployeeHours>(value || {})

  const handleDayToggle = (day: string, isWorking: boolean) => {
    const newHours = { ...hours }
    
    if (isWorking) {
      // Set default hours based on business hours or standard hours
      const businessDay = businessHours?.[day]
      newHours[day] = {
        start: businessDay?.open || '09:00',
        end: businessDay?.close || '18:00',
        hasLunchBreak: businessDay?.hasLunchBreak || false,
        lunchStart: businessDay?.lunchStart || '12:00',
        lunchEnd: businessDay?.lunchEnd || '13:00',
      }
    } else {
      newHours[day] = undefined
    }
    
    setHours(newHours)
    onChange(newHours)
  }

  const handleTimeChange = (day: string, field: 'start' | 'end' | 'lunchStart' | 'lunchEnd', time: string) => {
    const newHours = {
      ...hours,
      [day]: { ...hours[day], [field]: time },
    }
    setHours(newHours)
    onChange(newHours)
  }

  const handleLunchBreakToggle = (day: string, hasLunchBreak: boolean) => {
    const newHours = {
      ...hours,
      [day]: { 
        ...hours[day], 
        hasLunchBreak,
        lunchStart: hasLunchBreak ? '12:00' : undefined,
        lunchEnd: hasLunchBreak ? '13:00' : undefined,
      },
    }
    setHours(newHours)
    onChange(newHours)
  }

  const copyToAllDays = (sourceDay: string) => {
    const sourceHours = hours[sourceDay]
    if (!sourceHours) return
    
    const newHours = { ...hours }
    
    WEEKDAYS.forEach(({ key }) => {
      if (key !== sourceDay) {
        newHours[key] = { ...sourceHours }
      }
    })
    
    setHours(newHours)
    onChange(newHours)
  }

  const copyFromBusinessHours = () => {
    if (!businessHours) return
    
    const newHours: EmployeeHours = {}
    
    WEEKDAYS.forEach(({ key }) => {
      const businessDay = businessHours[key]
      if (businessDay && businessDay.isOpen) {
        newHours[key] = {
          start: businessDay.open,
          end: businessDay.close,
          hasLunchBreak: businessDay.hasLunchBreak || false,
          lunchStart: businessDay.lunchStart,
          lunchEnd: businessDay.lunchEnd,
        }
      }
    })
    
    setHours(newHours)
    onChange(newHours)
  }

  return (
    <div className="space-y-4">
      {businessHours && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyFromBusinessHours}
          >
            Geschäftszeiten übernehmen
          </Button>
        </div>
      )}
      
      <div className="grid gap-3">
        {WEEKDAYS.map(({ key, label }) => {
          const dayHours = hours[key]
          const isWorking = !!dayHours
          const businessDay = businessHours?.[key]
          
          return (
            <div key={key} className="flex items-start gap-4 p-3 border rounded-lg">
              <div className="flex items-center gap-2 w-32">
                <Checkbox
                  id={`${key}-working`}
                  checked={isWorking}
                  onCheckedChange={(checked) => handleDayToggle(key, checked as boolean)}
                />
                <Label 
                  htmlFor={`${key}-working`}
                  className={isWorking ? '' : 'text-muted-foreground'}
                >
                  {label}
                </Label>
              </div>
              
              {isWorking && dayHours ? (
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={dayHours.start || ''}
                        onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={dayHours.end || ''}
                        onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                        className="w-32"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${key}-lunch`}
                        checked={dayHours.hasLunchBreak || false}
                        onCheckedChange={(checked) => handleLunchBreakToggle(key, checked as boolean)}
                      />
                      <Label htmlFor={`${key}-lunch`} className="text-sm font-normal">
                        Mittagspause
                      </Label>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToAllDays(key)}
                      className="ml-auto"
                    >
                      Auf alle Tage übertragen
                    </Button>
                  </div>
                  
                  {dayHours.hasLunchBreak && (
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm text-muted-foreground">Pause:</span>
                      <Input
                        type="time"
                        value={dayHours.lunchStart || '12:00'}
                        onChange={(e) => handleTimeChange(key, 'lunchStart', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={dayHours.lunchEnd || '13:00'}
                        onChange={(e) => handleTimeChange(key, 'lunchEnd', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 text-muted-foreground">
                  {businessDay && businessDay.isOpen ? (
                    <span className="text-sm">
                      Geschäft geöffnet: {businessDay.open} - {businessDay.close}
                      {businessDay.hasLunchBreak && ` (Pause: ${businessDay.lunchStart} - ${businessDay.lunchEnd})`}
                    </span>
                  ) : (
                    <span>Geschäft geschlossen</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Tipp: Mitarbeiter können nur innerhalb der Geschäftszeiten arbeiten.</p>
        <p>Arbeitszeiten werden bei der Terminbuchung berücksichtigt.</p>
      </div>
    </div>
  )
}