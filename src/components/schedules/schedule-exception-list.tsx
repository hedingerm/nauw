'use client'

import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import type { ScheduleExceptionWithRelations } from '@/src/lib/schemas/schedule-exception'
import { Calendar, Clock, Info, Trash2 } from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface ScheduleExceptionListProps {
  exceptions: ScheduleExceptionWithRelations[]
  onDelete?: (id: string) => void
}

export function ScheduleExceptionList({ exceptions, onDelete }: ScheduleExceptionListProps) {
  const sortedExceptions = [...exceptions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const getExceptionTypeBadge = (type: string) => {
    switch (type) {
      case 'unavailable':
        return <Badge className="bg-red-100 text-red-800">Abwesend</Badge>
      case 'modified_hours':
        return <Badge className="bg-blue-100 text-blue-800">Geänderte Zeiten</Badge>
      case 'holiday':
        return <Badge className="bg-purple-100 text-purple-800">Feiertag</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  const isPastException = (date: string) => {
    const exceptionDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return exceptionDate < today
  }

  return (
    <div className="space-y-2">
      {sortedExceptions.map((exception) => {
        const isPast = isPastException(exception.date)
        
        return (
          <div
            key={exception.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border',
              isPast && 'opacity-60 bg-muted/30'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'mt-0.5',
                isPast && 'opacity-50'
              )}>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {format(new Date(exception.date), 'EEEE, d. MMMM yyyy', { locale: de })}
                  </span>
                  {getExceptionTypeBadge(exception.type)}
                </div>
                
                {exception.type === 'modified_hours' && exception.startTime && exception.endTime && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{exception.startTime} - {exception.endTime} Uhr</span>
                  </div>
                )}
                
                {exception.reason && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>{exception.reason}</span>
                  </div>
                )}
              </div>
            </div>

            {onDelete && !isPast && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(exception.id)}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      })}
      
      {sortedExceptions.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Keine Ausnahmen vorhanden
        </p>
      )}
    </div>
  )
}