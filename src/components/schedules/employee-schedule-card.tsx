'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { EmployeeHoursSelector } from '@/src/components/employees/employee-hours-selector'
import { User, Clock, AlertCircle, Check, X, Edit2 } from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface EmployeeScheduleCardProps {
  employee: any
  businessHours: any
  onSave: (hours: any) => void
  onModify: (modified: boolean) => void
  isModified: boolean
  saving: boolean
}

const WEEKDAYS = [
  { key: 'monday', label: 'Mo' },
  { key: 'tuesday', label: 'Di' },
  { key: 'wednesday', label: 'Mi' },
  { key: 'thursday', label: 'Do' },
  { key: 'friday', label: 'Fr' },
  { key: 'saturday', label: 'Sa' },
  { key: 'sunday', label: 'So' },
]

export function EmployeeScheduleCard({
  employee,
  businessHours,
  onSave,
  onModify,
  isModified,
  saving,
}: EmployeeScheduleCardProps) {
  const [editing, setEditing] = useState(false)
  const [localHours, setLocalHours] = useState<any>({})

  useEffect(() => {
    // Transform employee hours from database format
    if (employee.workingHours) {
      const transformedHours: any = {}
      Object.entries(employee.workingHours).forEach(([day, dayHours]: [string, any]) => {
        if (dayHours) {
          transformedHours[day] = {
            start: dayHours.start || dayHours.open,
            end: dayHours.end || dayHours.close,
            hasLunchBreak: dayHours.hasLunchBreak || !!dayHours.lunchStart,
            lunchStart: dayHours.lunchStart,
            lunchEnd: dayHours.lunchEnd,
          }
        }
      })
      setLocalHours(transformedHours)
    }
  }, [employee.workingHours])

  const hasCustomHours = employee.workingHours && Object.keys(employee.workingHours).length > 0
  const hasScheduleConflicts = checkScheduleConflicts()

  function checkScheduleConflicts() {
    if (!hasCustomHours || !businessHours) return false

    return Object.entries(localHours).some(([day, hours]: [string, any]) => {
      if (!hours) return false // Not working is not a conflict
      const businessDay = businessHours[day]
      if (!businessDay?.isOpen) return true // Working on a closed day is a conflict

      // Check if hours are outside business hours
      if (hours.start < businessDay.openTime || hours.end > businessDay.closeTime) {
        return true
      }

      return false
    })
  }

  const handleSave = () => {
    onSave(localHours)
    setEditing(false)
    onModify(false)
  }

  const handleCancel = () => {
    // Reset to original hours
    if (employee.workingHours) {
      const transformedHours: any = {}
      Object.entries(employee.workingHours).forEach(([day, dayHours]: [string, any]) => {
        if (dayHours) {
          transformedHours[day] = {
            start: dayHours.start || dayHours.open,
            end: dayHours.end || dayHours.close,
            hasLunchBreak: dayHours.hasLunchBreak || !!dayHours.lunchStart,
            lunchStart: dayHours.lunchStart,
            lunchEnd: dayHours.lunchEnd,
          }
        }
      })
      setLocalHours(transformedHours)
    } else {
      setLocalHours({})
    }
    setEditing(false)
    onModify(false)
  }

  const handleChange = (newHours: any) => {
    setLocalHours(newHours)
    onModify(true)
  }

  const getDayDisplay = (day: string) => {
    const hours = localHours[day]
    const businessDay = businessHours?.[day]

    // If employee has custom hours but this day is explicitly not set, they don't work
    if (hasCustomHours && !hours && businessDay?.isOpen) {
      return { text: 'Frei', color: 'text-orange-600' }
    }
    // Business closed
    if (!businessDay?.isOpen) {
      return { text: '—', color: 'text-muted-foreground' }
    }
    // No custom hours set, uses business hours
    if (!hasCustomHours && !hours && businessDay?.isOpen) {
      return { text: 'Standard', color: 'text-blue-600' }
    }
    // Has specific hours
    if (hours) {
      return { text: `${hours.start}-${hours.end}`, color: 'text-green-600' }
    }
    return { text: '—', color: 'text-muted-foreground' }
  }

  return (
    <Card className={cn(hasScheduleConflicts && "border-orange-200")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {employee.name}
                {hasCustomHours ? (
                  <Badge variant="secondary" className="text-xs">
                    Individuelle Zeiten
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Standard-Zeiten
                  </Badge>
                )}
              </h3>
              {employee.role && (
                <p className="text-sm text-muted-foreground">{employee.role}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasScheduleConflicts && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Konflikt</span>
              </div>
            )}
            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !isModified}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Speichern
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <EmployeeHoursSelector
              value={localHours}
              onChange={handleChange}
              businessHours={businessHours}
            />
            {hasScheduleConflicts && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-orange-700">
                  <p className="font-medium">Zeitkonflikt erkannt</p>
                  <p>Die Arbeitszeiten liegen außerhalb der Geschäftszeiten oder an geschlossenen Tagen.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick schedule overview */}
            <div className="flex items-center gap-2 flex-wrap">
              {WEEKDAYS.map(({ key, label }) => {
                const display = getDayDisplay(key)
                return (
                  <div key={key} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{label}</div>
                    <div className={cn("text-xs font-medium", display.color)}>
                      {display.text}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Detailed view */}
            {hasCustomHours && (
              <div className="pt-2 border-t">
                <div className="space-y-1">
                  {WEEKDAYS.map(({ key, label }) => {
                    const hours = localHours[key]
                    const businessDay = businessHours?.[key]
                    
                    // Only show days where business is open
                    if (!businessDay?.isOpen) return null
                    
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium w-8">{label}:</span>
                        {hours ? (
                          <span>
                            {hours.start} - {hours.end}
                            {hours.hasLunchBreak && (
                              <span className="text-muted-foreground ml-2">
                                (Pause: {hours.lunchStart} - {hours.lunchEnd})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-orange-600 font-medium">Frei (arbeitet nicht)</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}