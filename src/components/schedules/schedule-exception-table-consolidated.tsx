'use client'

import { useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import type { ConsolidatedExceptionGroup } from '@/src/lib/services/schedule-exception.service'
import { Calendar, Clock, Info, Trash2, Users, ChevronDown, ChevronRight } from 'lucide-react'
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

interface ScheduleExceptionTableConsolidatedProps {
  groups: ConsolidatedExceptionGroup[]
  onDelete?: (ids: string[]) => void
  onBulkDelete?: (ids: string[]) => void
}

export function ScheduleExceptionTableConsolidated({
  groups,
  onDelete,
  onBulkDelete,
}: ScheduleExceptionTableConsolidatedProps) {
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

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

  const getGroupKey = (group: ConsolidatedExceptionGroup) => {
    return `${group.date}-${group.reason || 'no-reason'}`
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const futureGroupKeys = groups
        .filter(g => !isPastException(g.date))
        .map(getGroupKey)
      setSelectedGroups(new Set(futureGroupKeys))
    } else {
      setSelectedGroups(new Set())
    }
  }

  const handleSelectGroup = (group: ConsolidatedExceptionGroup, checked: boolean) => {
    const key = getGroupKey(group)
    const newSelected = new Set(selectedGroups)
    if (checked) {
      newSelected.add(key)
    } else {
      newSelected.delete(key)
    }
    setSelectedGroups(newSelected)
  }

  const toggleGroupExpansion = (rangeKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(rangeKey)) {
      newExpanded.delete(rangeKey)
    } else {
      newExpanded.add(rangeKey)
    }
    setExpandedGroups(newExpanded)
  }

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedGroups.size > 0) {
      const idsToDelete: string[] = []
      groups.forEach(group => {
        if (selectedGroups.has(getGroupKey(group))) {
          group.exceptions.forEach(exception => {
            idsToDelete.push(exception.id)
          })
        }
      })
      onBulkDelete(idsToDelete)
      setSelectedGroups(new Set())
    }
  }

  const handleDeleteGroup = (group: ConsolidatedExceptionGroup) => {
    if (onDelete) {
      const ids = group.exceptions.map(e => e.id)
      onDelete(ids)
    }
  }

  const getEmployeeNamesDisplay = (names: string[]) => {
    if (names.length <= 3) {
      return names.join(', ')
    }
    return `${names.slice(0, 3).join(', ')} +${names.length - 3}`
  }

  // Find consecutive date ranges in groups
  const findDateRanges = (groups: ConsolidatedExceptionGroup[]) => {
    const ranges: Array<{
      startDate: string
      endDate: string
      reason: string | null
      type: string
      groups: ConsolidatedExceptionGroup[]
    }> = []

    let currentRange: typeof ranges[0] | null = null

    groups.forEach((group, index) => {
      if (!currentRange || 
          currentRange.reason !== group.reason || 
          currentRange.type !== group.type ||
          (index > 0 && differenceInDays(new Date(group.date), new Date(groups[index - 1].date)) > 1)) {
        if (currentRange) {
          ranges.push(currentRange)
        }
        currentRange = {
          startDate: group.date,
          endDate: group.date,
          reason: group.reason,
          type: group.type,
          groups: [group]
        }
      } else {
        currentRange.endDate = group.date
        currentRange.groups.push(group)
      }
    })

    if (currentRange) {
      ranges.push(currentRange)
    }

    return ranges
  }

  const dateRanges = findDateRanges(groups)

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Keine Ausnahmen gefunden</p>
      </div>
    )
  }

  const selectedCount = Array.from(selectedGroups).reduce((count, key) => {
    const group = groups.find(g => getGroupKey(g) === key)
    return count + (group?.exceptions.length || 0)
  }, 0)

  return (
    <div className="space-y-4">
      {selectedGroups.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm">
            {selectedCount} Ausnahme{selectedCount !== 1 && 'n'} in {selectedGroups.size} Gruppe{selectedGroups.size !== 1 && 'n'} ausgewählt
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
                    groups.filter(g => !isPastException(g.date)).length > 0 &&
                    selectedGroups.size === groups.filter(g => !isPastException(g.date)).length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Zeitraum</TableHead>
              <TableHead>Grund</TableHead>
              <TableHead>Mitarbeiter</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dateRanges.map((range, index) => {
              const isMultipleDays = range.startDate !== range.endDate
              const allEmployeeNames = new Set<string>()
              const allEmployeeIds = new Set<string>()
              
              range.groups.forEach(group => {
                group.employeeNames.forEach(name => allEmployeeNames.add(name))
                group.employeeIds.forEach(id => allEmployeeIds.add(id))
              })

              const employeeNamesArray = Array.from(allEmployeeNames)
              const isPast = isPastException(range.endDate)
              const rangeKey = `${range.startDate}-${range.endDate}-${range.reason}`
              const isExpanded = expandedGroups.has(rangeKey)

              return [
                <TableRow key={`range-${index}`} className={cn(isPast && "opacity-60")}>
                  <TableCell>
                    <Checkbox
                      checked={range.groups.every(g => selectedGroups.has(getGroupKey(g)))}
                      onCheckedChange={(checked) => {
                        range.groups.forEach(group => {
                          handleSelectGroup(group, checked as boolean)
                        })
                      }}
                      disabled={isPast}
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-auto font-normal"
                      onClick={() => isMultipleDays && toggleGroupExpansion(rangeKey)}
                    >
                      <div className="flex items-center gap-2">
                        {isMultipleDays && (
                          isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                        )}
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {isMultipleDays ? (
                            <>
                              {format(new Date(range.startDate), 'd. MMM', { locale: de })} - {format(new Date(range.endDate), 'd. MMM yyyy', { locale: de })}
                              <Badge variant="outline" className="ml-2">{range.groups.length} Tage</Badge>
                            </>
                          ) : (
                            format(new Date(range.startDate), 'EEE, d. MMM yyyy', { locale: de })
                          )}
                        </span>
                      </div>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getExceptionTypeBadge(range.type)}
                      {range.reason && (
                        <span className="text-sm">{range.reason}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {employeeNamesArray.length} Mitarbeiter
                        {employeeNamesArray.length <= 3 && `: ${getEmployeeNamesDisplay(employeeNamesArray)}`}
                      </span>
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
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => {
                                const allIds = range.groups.flatMap(g => g.exceptions.map(e => e.id))
                                onDelete(allIds)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Alle löschen
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>,
                ...(isMultipleDays && isExpanded ? range.groups.map((group, groupIndex) => (
                  <TableRow 
                    key={`range-${index}-group-${groupIndex}`} 
                    className={cn(
                      "bg-muted/30",
                      isPastException(group.date) && "opacity-60"
                    )}
                  >
                    <TableCell className="pl-12">
                      <Checkbox
                        checked={selectedGroups.has(getGroupKey(group))}
                        onCheckedChange={(checked) => handleSelectGroup(group, checked as boolean)}
                        disabled={isPastException(group.date)}
                      />
                    </TableCell>
                    <TableCell className="pl-12">
                      {format(new Date(group.date), 'EEE, d. MMM', { locale: de })}
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {getEmployeeNamesDisplay(group.employeeNames)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {!isPastException(group.date) && onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteGroup(group)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )) : [])
              ]
            }).flat()}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}