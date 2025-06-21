'use client'

import { useState } from 'react'
import { CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Calendar } from '@/src/components/ui/calendar'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Badge } from '@/src/components/ui/badge'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { format, addDays, isSameDay } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/src/lib/utils/cn'
import type { Database } from '@/src/lib/supabase/database.types'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'

type Service = Database['public']['Tables']['Service']['Row']
type Employee = Database['public']['Tables']['Employee']['Row']

interface TimeSlot {
  time: string
  available: boolean
  employeeId?: string
  employeeName?: string
  availableEmployeeCount?: number
  availableEmployees?: Array<{ id: string; name: string }>
}

interface DateTimePickerProps {
  selectedService: Service
  selectedDate: Date | undefined
  selectedTime: string | null
  selectedEmployee: Employee | null
  availableSlots: TimeSlot[]
  loadingSlots: boolean
  config: BookingPageConfig | null
  weekOffset: number
  onDateSelect: (date: Date | undefined) => void
  onTimeSelect: (time: string) => void
  onWeekOffsetChange: (offset: number) => void
  isBusinessOpenOnDate: (date: Date) => boolean
}

export function DateTimePicker({
  selectedService,
  selectedDate,
  selectedTime,
  selectedEmployee,
  availableSlots,
  loadingSlots,
  config,
  weekOffset,
  onDateSelect,
  onTimeSelect,
  onWeekOffsetChange,
  isBusinessOpenOnDate
}: DateTimePickerProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDays = config?.layout.maxAdvanceBookingDays || 60

  const renderCalendarView = () => {
    if (config?.layout.calendarView === 'list') {
      // List View - Show only available dates
      const availableDates = []
      for (let i = 0; i <= maxDays; i++) {
        const date = addDays(today, i)
        if (isBusinessOpenOnDate(date)) {
          availableDates.push(date)
        }
      }
      
      if (availableDates.length === 0) {
        return <p className="text-muted-foreground">Keine verfügbaren Termine</p>
      }
      
      return availableDates.slice(0, 20).map((date) => (
        <Button
          key={date.toISOString()}
          variant={selectedDate && isSameDay(selectedDate, date) ? 'default' : 'outline'}
          className="w-full justify-start"
          onClick={() => onDateSelect(date)}
          style={selectedDate && isSameDay(selectedDate, date) ? {
            backgroundColor: config?.theme.primaryColor,
            borderColor: config?.theme.primaryColor
          } : {}}
        >
          {format(date, 'EEEE, d. MMMM yyyy', { locale: de })}
        </Button>
      ))
    } else if (config?.layout.calendarView === 'week') {
      // Week View - Show 7 days at a time
      const baseStartOfWeek = new Date(today)
      baseStartOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
      const startOfWeek = addDays(baseStartOfWeek, weekOffset * 7)
      
      return (
        <>
          {/* Week Navigation Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onWeekOffsetChange(weekOffset - 1)}
              disabled={weekOffset <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <p className="font-medium">
                {format(startOfWeek, 'MMMM yyyy', { locale: de })}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(startOfWeek, 'd.')} - {format(addDays(startOfWeek, 6), 'd. MMMM', { locale: de })}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onWeekOffsetChange(weekOffset + 1)}
              disabled={addDays(startOfWeek, 7) > addDays(today, maxDays)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Week Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDays(startOfWeek, i)
              const isDisabled = date < today || 
                               date > addDays(today, maxDays) || 
                               !isBusinessOpenOnDate(date)
              const isToday = isSameDay(date, today)
              
              return (
                <Button
                  key={date.toISOString()}
                  variant={selectedDate && isSameDay(selectedDate, date) ? 'default' : 'outline'}
                  size="sm"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onDateSelect(date)}
                  className={cn(
                    "flex flex-col items-center p-2 h-auto",
                    isToday && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={selectedDate && isSameDay(selectedDate, date) ? {
                    backgroundColor: config?.theme.primaryColor,
                    borderColor: config?.theme.primaryColor
                  } : {}}
                >
                  <span className="text-xs">{format(date, 'EEE', { locale: de })}</span>
                  <span className="text-lg font-semibold">{format(date, 'd')}</span>
                  {isToday && <span className="text-xs">Heute</span>}
                </Button>
              )
            })}
          </div>
        </>
      )
    } else {
      // Month View (default)
      return (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            .calendar-custom [data-selected-single="true"] {
              background-color: ${config?.theme.primaryColor || '#2563eb'} !important;
              color: white !important;
              font-weight: 600;
              border: 2px solid ${config?.theme.primaryColor || '#2563eb'} !important;
            }
            .calendar-custom [data-selected-single="true"]:hover {
              background-color: ${config?.theme.primaryColor || '#2563eb'} !important;
              opacity: 0.9;
            }
            .calendar-custom .rdp-today {
              font-weight: 700;
              color: ${config?.theme.primaryColor || '#2563eb'};
            }
          `}} />
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            disabled={(date) => {
              if (date < today) return true
              if (date > addDays(today, maxDays)) return true
              return !isBusinessOpenOnDate(date)
            }}
            locale={de}
            className="rounded-md border mt-2 calendar-custom"
          />
        </>
      )
    }
  }

  return (
    <div>
      <CardHeader className="px-0 pt-0">
        <CardTitle>Termin auswählen</CardTitle>
        <CardDescription>
          Wählen Sie Ihren Wunschtermin für: {selectedService.name}
        </CardDescription>
      </CardHeader>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label>Datum auswählen</Label>
          <div className={cn(
            "mt-2",
            config?.layout.calendarView === 'list' && "space-y-2 max-h-96 overflow-y-auto border rounded-md p-4",
            config?.layout.calendarView === 'week' && "border rounded-md p-4"
          )}>
            {renderCalendarView()}
          </div>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div>
            <Label>Zeit auswählen</Label>
            {loadingSlots ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="space-y-4">
                {/* Show info about multiple employees if any slot has more than 1 */}
                {availableSlots.some(s => s.availableEmployeeCount && s.availableEmployeeCount > 1) && (
                  <p className="text-sm text-muted-foreground">
                    Die Zahl zeigt an, wie viele Mitarbeiter zu dieser Zeit verfügbar sind.
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <div key={`${slot.time}-${slot.employeeId || 'any'}`} className="relative">
                      <Button
                        variant={selectedTime === slot.time ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onTimeSelect(slot.time)}
                        disabled={!slot.available}
                        className="w-full relative"
                        style={selectedTime === slot.time ? {
                          backgroundColor: config?.theme.primaryColor,
                          borderColor: config?.theme.primaryColor
                        } : {}}
                      >
                        {slot.time}
                        {slot.availableEmployeeCount && slot.availableEmployeeCount > 1 && (
                          <Badge 
                            variant="secondary" 
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center"
                            style={{ backgroundColor: config?.theme.accentColor }}
                          >
                            {slot.availableEmployeeCount}
                          </Badge>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* Selected Time Info */}
                {selectedTime && selectedEmployee && (
                  <div className="mt-8 p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Ausgewählter Termin:</strong> {selectedTime} Uhr
                      {config?.features.showEmployeeNames && ` mit ${selectedEmployee.name}`}
                    </p>
                    {(() => {
                      const slot = availableSlots.find(s => s.time === selectedTime)
                      return slot && slot.availableEmployeeCount && slot.availableEmployeeCount > 1 ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Automatisch zugewiesen für gleichmäßige Auslastung
                        </p>
                      ) : null
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground mt-4">
                Keine verfügbaren Zeiten für dieses Datum
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}