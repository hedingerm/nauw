'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Calendar, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import type { TimeSlot } from '@/src/lib/services/availability.service'

interface TimeSlotPickerProps {
  selectedDate: Date
  availableSlots: TimeSlot[]
  initialTime?: string
  loading?: boolean
  onSelect: (slot: TimeSlot) => void
  disabled?: boolean
}

export function TimeSlotPicker({
  selectedDate,
  availableSlots,
  initialTime,
  loading,
  onSelect,
  disabled,
}: TimeSlotPickerProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  
  // Set initial selection when component mounts or initialTime changes
  useEffect(() => {
    if (initialTime && availableSlots.length > 0) {
      const initialSlot = availableSlots.find(slot => {
        const slotTime = format(new Date(slot.startTime), 'HH:mm')
        return slotTime === initialTime
      })
      if (initialSlot) {
        setSelectedSlot(initialSlot)
        onSelect(initialSlot) // Also trigger the onSelect callback
      }
    }
  }, [initialTime, availableSlots])

  // Group slots by hour
  const slotsByHour = availableSlots.reduce((acc, slot) => {
    const hour = new Date(slot.startTime).getHours()
    if (!acc[hour]) {
      acc[hour] = []
    }
    acc[hour].push(slot)
    return acc
  }, {} as Record<number, TimeSlot[]>)

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    onSelect(slot)
  }

  if (disabled) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
        Bitte wählen Sie zuerst einen Service und Mitarbeiter aus
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Date Display */}
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">
          {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}
        </span>
      </div>

      {/* Time Slots */}
      <div className="border rounded-lg p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Verfügbare Zeiten werden geladen...
            </span>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Keine verfügbaren Zeiten für dieses Datum
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {Object.entries(slotsByHour).map(([hour, slots]) => (
              <div key={hour} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {hour}:00 Uhr
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const time = format(new Date(slot.startTime), 'HH:mm')
                    const isSelected = selectedSlot?.startTime === slot.startTime && selectedSlot?.employeeId === slot.employeeId
                    
                    return (
                      <Button
                        key={`${slot.startTime}-${slot.employeeId}`}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'text-sm',
                          !slot.available && 'opacity-50 cursor-not-allowed'
                        )}
                        onClick={() => handleSelectSlot(slot)}
                        disabled={!slot.available}
                      >
                        {time}
                        {slot.employeeName && (
                          <span className="block text-xs opacity-75">
                            {slot.employeeName}
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Time Display */}
      {selectedSlot && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Ausgewählte Zeit: {format(new Date(selectedSlot.startTime), 'HH:mm')} Uhr
            {selectedSlot.employeeName && ` mit ${selectedSlot.employeeName}`}
          </span>
        </div>
      )}
    </div>
  )
}