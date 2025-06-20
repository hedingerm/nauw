'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/lib/auth/context'
import { BusinessService } from '@/src/lib/services/business.service'
import { CalendarView } from '@/src/components/calendar/calendar-view'
import { CalendarHeader } from '@/src/components/calendar/calendar-header'
import { AppointmentCreateDialog } from '@/src/components/calendar/appointment-create-dialog'
import type { CalendarViewType } from '@/src/components/calendar/types'

export default function CalendarPage() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<CalendarViewType>('week')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    date: Date
    time: string
    employeeId?: string
  } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadBusinessData()
  }, [user])

  const loadBusinessData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const businessData = await BusinessService.getCurrentBusiness()
      if (businessData) {
        setBusiness(businessData)
      }
    } catch (error) {
      console.error('Error loading business:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date: Date) => {
    setCurrentDate(date)
  }

  const handleViewChange = (view: CalendarViewType) => {
    setViewType(view)
  }

  const handleEmployeeChange = (employeeId: string | null) => {
    setSelectedEmployeeId(employeeId)
  }

  const handleTimeSlotClick = (date: Date, time: string, employeeId?: string) => {
    setSelectedTimeSlot({ date, time, employeeId })
    setCreateDialogOpen(true)
  }

  const handleCreateAppointment = () => {
    setCreateDialogOpen(false)
    setSelectedTimeSlot(null)
    // Refresh calendar by incrementing the key
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">
          Geschäftsdaten konnten nicht geladen werden.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <CalendarHeader
        currentDate={currentDate}
        viewType={viewType}
        onDateChange={handleDateChange}
        onViewChange={handleViewChange}
        onEmployeeChange={handleEmployeeChange}
        selectedEmployeeId={selectedEmployeeId}
        businessId={business.id}
      />
      
      <div className="flex-1 overflow-hidden">
        <CalendarView
          key={refreshKey}
          businessId={business.id}
          currentDate={currentDate}
          viewType={viewType}
          selectedEmployeeId={selectedEmployeeId}
          onTimeSlotClick={handleTimeSlotClick}
        />
      </div>

      <AppointmentCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        businessId={business.id}
        initialDate={selectedTimeSlot?.date}
        initialTime={selectedTimeSlot?.time}
        initialEmployeeId={selectedTimeSlot?.employeeId}
        onSuccess={handleCreateAppointment}
      />
    </div>
  )
}