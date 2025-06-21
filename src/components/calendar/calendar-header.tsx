'use client'

import { Button } from '@/src/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react'
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns'
import { de } from 'date-fns/locale'
import type { CalendarViewType } from './types'
import { useEffect, useState } from 'react'
import { EmployeeService } from '@/src/lib/services/employee.service'

interface CalendarHeaderProps {
  currentDate: Date
  viewType: CalendarViewType
  onDateChange: (date: Date) => void
  onViewChange: (view: CalendarViewType) => void
  onEmployeeChange: (employeeId: string | null) => void
  selectedEmployeeId: string | null
  businessId: string
}

export function CalendarHeader({
  currentDate,
  viewType,
  onDateChange,
  onViewChange,
  onEmployeeChange,
  selectedEmployeeId,
  businessId,
}: CalendarHeaderProps) {
  const [employees, setEmployees] = useState<any[]>([])

  useEffect(() => {
    loadEmployees()
  }, [businessId])

  const loadEmployees = async () => {
    try {
      const data = await EmployeeService.list(businessId)
      setEmployees(data.filter(e => e.isActive && e.canPerformServices))
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const handlePrevious = () => {
    switch (viewType) {
      case 'day':
        onDateChange(subDays(currentDate, 1))
        break
      case 'week':
      case 'team':
        onDateChange(subWeeks(currentDate, 1))
        break
      case 'month':
        onDateChange(subMonths(currentDate, 1))
        break
    }
  }

  const handleNext = () => {
    switch (viewType) {
      case 'day':
        onDateChange(addDays(currentDate, 1))
        break
      case 'week':
      case 'team':
        onDateChange(addWeeks(currentDate, 1))
        break
      case 'month':
        onDateChange(addMonths(currentDate, 1))
        break
    }
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const getDateRangeText = () => {
    switch (viewType) {
      case 'day':
        return format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de })
      case 'week':
      case 'team':
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, 'd.')} - ${format(weekEnd, 'd. MMMM yyyy', { locale: de })}`
        } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
          return `${format(weekStart, 'd. MMMM')} - ${format(weekEnd, 'd. MMMM yyyy', { locale: de })}`
        } else {
          return `${format(weekStart, 'd. MMMM yyyy')} - ${format(weekEnd, 'd. MMMM yyyy', { locale: de })}`
        }
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: de })
      default:
        return ''
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            onClick={handleToday}
          >
            Heute
          </Button>
          
          <h2 className="text-xl font-semibold">
            {getDateRangeText()}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <Select value={viewType} onValueChange={(value) => onViewChange(value as CalendarViewType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Tag</SelectItem>
              <SelectItem value="week">Woche</SelectItem>
              <SelectItem value="month">Monat</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>

          {employees.length > 0 && viewType !== 'team' && (
            <Select 
              value={selectedEmployeeId || 'all'} 
              onValueChange={(value) => onEmployeeChange(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  )
}