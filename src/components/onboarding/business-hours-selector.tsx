'use client'

import { useState } from 'react'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'

export interface BusinessHours {
  [key: string]: {
    isOpen: boolean
    openTime: string
    closeTime: string
    hasLunchBreak?: boolean
    lunchStart?: string
    lunchEnd?: string
  }
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

const DEFAULT_HOURS = {
  monday: { isOpen: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false },
  wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false },
  thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false },
  friday: { isOpen: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false },
  saturday: { isOpen: false, openTime: '09:00', closeTime: '13:00', hasLunchBreak: false },
  sunday: { isOpen: false, openTime: '09:00', closeTime: '13:00', hasLunchBreak: false },
}

interface BusinessHoursSelectorProps {
  value: BusinessHours
  onChange: (hours: BusinessHours) => void
}

export function BusinessHoursSelector({ value, onChange }: BusinessHoursSelectorProps) {
  const [hours, setHours] = useState<BusinessHours>(value || DEFAULT_HOURS)

  const handleDayToggle = (day: string, isOpen: boolean) => {
    const newHours = {
      ...hours,
      [day]: { ...hours[day], isOpen },
    }
    setHours(newHours)
    onChange(newHours)
  }

  const handleTimeChange = (day: string, type: 'openTime' | 'closeTime' | 'lunchStart' | 'lunchEnd', time: string) => {
    const newHours = {
      ...hours,
      [day]: { ...hours[day], [type]: time },
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
    const newHours = { ...hours }
    
    WEEKDAYS.forEach(({ key }) => {
      if (key !== sourceDay) {
        newHours[key] = { ...sourceHours }
      }
    })
    
    setHours(newHours)
    onChange(newHours)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {WEEKDAYS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="flex items-center gap-2 w-32">
              <Checkbox
                id={`${key}-open`}
                checked={hours[key].isOpen}
                onCheckedChange={(checked) => handleDayToggle(key, checked as boolean)}
              />
              <Label 
                htmlFor={`${key}-open`}
                className={hours[key].isOpen ? '' : 'text-muted-foreground'}
              >
                {label}
              </Label>
            </div>
            
            {hours[key].isOpen ? (
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={hours[key].openTime}
                      onChange={(e) => handleTimeChange(key, 'openTime', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={hours[key].closeTime}
                      onChange={(e) => handleTimeChange(key, 'closeTime', e.target.value)}
                      className="w-32"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${key}-lunch`}
                      checked={hours[key].hasLunchBreak || false}
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
                
                {hours[key].hasLunchBreak && (
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm text-muted-foreground">Pause:</span>
                    <Input
                      type="time"
                      value={hours[key].lunchStart || '12:00'}
                      onChange={(e) => handleTimeChange(key, 'lunchStart', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={hours[key].lunchEnd || '13:00'}
                      onChange={(e) => handleTimeChange(key, 'lunchEnd', e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Geschlossen</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Tipp: Sie können die Öffnungszeiten eines Tages auf alle anderen Tage übertragen.</p>
        <p>Mittagspausen werden bei der Terminbuchung berücksichtigt.</p>
      </div>
    </div>
  )
}