'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import type { ScheduleExceptionWithRelations } from '@/src/lib/schemas/schedule-exception'
import { Calendar, Clock, Info, Trash2, Plus, User } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

interface ScheduleExceptionTableProps {
  exceptions: ScheduleExceptionWithRelations[]
  employees: any[]
  onDelete?: (id: string) => void
  onBulkDelete?: (ids: string[]) => void
  onCreateException?: (employeeId: string) => void
  compact?: boolean
}

export function ScheduleExceptionTable({
  exceptions,
  employees,
  onDelete,
  onBulkDelete,
  onCreateException,
  compact = false,
}: ScheduleExceptionTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const futureIds = sortedExceptions
        .filter(e => !isPastException(e.date))
        .map(e => e.id)
      setSelectedIds(new Set(futureIds))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedIds.size > 0) {
      onBulkDelete(Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    return employee?.name || 'Unbekannt'
  }

  // Group exceptions by employee for better overview
  const groupedByEmployee = sortedExceptions.reduce((groups, exception) => {
    const employeeId = exception.employeeId
    if (!groups[employeeId]) {
      groups[employeeId] = []
    }
    groups[employeeId].push(exception)
    return groups
  }, {} as Record<string, ScheduleExceptionWithRelations[]>)

  if (sortedExceptions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Keine Ausnahmen gefunden</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm">
            {selectedIds.size} Ausnahme{selectedIds.size !== 1 && 'n'} ausgewählt
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Löschen
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    sortedExceptions.filter(e => !isPastException(e.date)).length > 0 &&
                    selectedIds.size === sortedExceptions.filter(e => !isPastException(e.date)).length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Mitarbeiter</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExceptions.map((exception) => {
              const isPast = isPastException(exception.date)
              const employee = employees.find(e => e.id === exception.employeeId)
              
              return (
                <TableRow
                  key={exception.id}
                  className={cn(isPast && "opacity-60")}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(exception.id)}
                      onCheckedChange={(checked) => handleSelectOne(exception.id, checked as boolean)}
                      disabled={isPast}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(exception.date), compact ? 'd. MMM' : 'EEE, d. MMM yyyy', { locale: de })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {employee?.name || 'Unbekannt'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getExceptionTypeBadge(exception.type)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {exception.type === 'modified_hours' && exception.startTime && exception.endTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
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
                  </TableCell>
                  <TableCell>
                    {!isPast && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onCreateException && (
                            <DropdownMenuItem onClick={() => onCreateException(exception.employeeId)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Weitere hinzufügen
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(exception.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}