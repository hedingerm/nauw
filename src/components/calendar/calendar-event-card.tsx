'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/src/lib/utils'
import type { CalendarEvent } from './types'
import { AppointmentDetailDialog } from './appointment-detail-dialog'

interface CalendarEventCardProps {
  event: CalendarEvent
  variant?: 'full' | 'compact'
}

export function CalendarEventCard({ event, variant = 'full' }: CalendarEventCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const timeRange = `${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDetailOpen(true)
  }
  
  if (variant === 'compact') {
    return (
      <>
        <div
          className={cn(
            'px-2 py-1 rounded text-xs border cursor-pointer hover:opacity-90 transition-opacity h-full',
            event.color
          )}
          onClick={handleClick}
        >
          <div className="font-medium truncate">{event.customerName}</div>
          <div className="text-xs opacity-75 truncate">{event.serviceName}</div>
        </div>
        <AppointmentDetailDialog
          appointmentId={event.id}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      </>
    )
  }
  
  return (
    <>
      <div
        className={cn(
          'p-2 rounded border cursor-pointer hover:opacity-90 transition-opacity h-full',
          event.color
        )}
        onClick={handleClick}
      >
        <div className="text-xs font-medium mb-1">{timeRange}</div>
        <div className="font-medium text-sm truncate">{event.customerName}</div>
        <div className="text-xs opacity-75 truncate">{event.serviceName}</div>
      </div>
      <AppointmentDetailDialog
        appointmentId={event.id}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}