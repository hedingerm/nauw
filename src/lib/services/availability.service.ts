import { createClient } from '@/src/lib/supabase/client'
import { BusinessService } from './business.service'
import { ServiceService } from './service.service'
import { EmployeeService } from './employee.service'
import { AppointmentService } from './appointment.service'
import { ScheduleExceptionService } from './schedule-exception.service'
import type { BusinessHours } from '@/src/lib/schemas/business'
import { toUTC, fromUTC, formatInZurich } from '@/src/lib/utils/timezone'

// Local type definitions for schedule data
interface DaySchedule {
  isOpen: boolean
  openTime: string
  closeTime: string
  hasLunchBreak: boolean
  lunchStart?: string
  lunchEnd?: string
}

export interface TimeSlot {
  startTime: string
  endTime: string
  employeeId: string
  employeeName?: string
  available: boolean
}

export interface AvailabilityParams {
  businessId: string
  serviceId: string
  date: string
  employeeId?: string // Optional - if not provided, check all employees
}

export interface DayAvailability {
  date: string
  hasAvailability: boolean
  timeSlots?: TimeSlot[]
}

export class AvailabilityService {
  private static async getClient() {
    return createClient()
  }

  // Simple method for customer booking - returns slots with HH:MM format
  static async getAvailableSlotsSimple(params: {
    businessId: string
    employeeId: string
    serviceId: string
    date: string
    duration: number
  }): Promise<{ startTime: string; available: boolean }[]> {
    const slots = await this.getAvailableSlots({
      businessId: params.businessId,
      serviceId: params.serviceId,
      date: params.date,
      employeeId: params.employeeId
    })
    
    return slots.map(slot => ({
      startTime: new Date(slot.startTime).toLocaleTimeString('de-CH', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      available: slot.available
    }))
  }

  // Main method to get available time slots for a service on a specific date
  static async getAvailableSlots(params: AvailabilityParams): Promise<TimeSlot[]> {
    const { businessId, serviceId, date, employeeId } = params
    
    
    // Get service details (duration, buffer times)
    const service = await ServiceService.getById(serviceId)
    
    // Get business hours
    const business = await BusinessService.getBusinessWithRelations(businessId)
    if (!business) {
      throw new Error('Business nicht gefunden')
    }
    
    // Calculate total time needed (duration + buffers)
    const totalDuration = service.duration + service.bufferBefore + service.bufferAfter
    
    // Get employees who can perform this service
    let employeesToCheck: string[] = []
    if (employeeId) {
      employeesToCheck = [employeeId]
    } else {
      const employees = await EmployeeService.getByService(serviceId)
      employeesToCheck = employees.filter(e => e.isActive).map(e => e.id)
    }
    
    
    if (employeesToCheck.length === 0) {
      return []
    }
    
    // Get available slots for each employee
    const allSlots: TimeSlot[] = []
    
    for (const empId of employeesToCheck) {
      const slots = await this.getEmployeeAvailableSlots({
        businessId,
        employeeId: empId,
        date,
        serviceDuration: service.duration,
        bufferBefore: service.bufferBefore,
        bufferAfter: service.bufferAfter,
      })
      allSlots.push(...slots)
    }
    
    // Sort slots by start time
    return allSlots.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
  }

  // Get available slots for a specific employee
  private static async getEmployeeAvailableSlots(params: {
    businessId: string
    employeeId: string
    date: string
    serviceDuration: number
    bufferBefore: number
    bufferAfter: number
  }): Promise<TimeSlot[]> {
    const { businessId, employeeId, date, serviceDuration, bufferBefore, bufferAfter } = params
    
    
    // Get employee details
    const employee = await EmployeeService.getById(employeeId)
    if (!employee || !employee.isActive || !employee.canPerformServices) {
      return []
    }
    
    // Check if employee is available on this date (schedule exceptions)
    const { available, exception } = await ScheduleExceptionService.isEmployeeAvailable(
      employeeId,
      date
    )
    
    if (!available) {
      return []
    }
    
    // Get working hours for this date
    const workingBlocks = await this.getEmployeeWorkingBlocks({
      businessId,
      employeeId,
      date,
      exception,
    })
    
    
    if (workingBlocks.length === 0) {
      return []
    }
    
    // Get existing appointments for this employee on this date
    const appointments = await AppointmentService.getByDateAndEmployee(
      businessId,
      date,
      employeeId
    )
    
    
    // Generate available time slots
    const totalDuration = serviceDuration + bufferBefore + bufferAfter
    const slots: TimeSlot[] = []
    
    for (const block of workingBlocks) {
      const blockSlots = this.generateSlotsForBlock({
        block,
        appointments,
        serviceDuration,
        bufferBefore,
        bufferAfter,
        totalDuration,
        employeeId,
        employeeName: employee.name,
      })
      slots.push(...blockSlots)
    }
    
    return slots
  }

  // Get working blocks for an employee on a specific date
  private static async getEmployeeWorkingBlocks(params: {
    businessId: string
    employeeId: string
    date: string
    exception?: any
  }): Promise<{ start: Date; end: Date }[]> {
    const { businessId, employeeId, date, exception } = params
    
    // Get business and employee data
    const business = await BusinessService.getBusinessWithRelations(businessId)
    const employee = await EmployeeService.getById(employeeId)
    
    if (!business || !employee) {
      return []
    }
    
    const dayOfWeek = this.getDayOfWeek(date)
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayName = dayNames[dayOfWeek]
    
    
    // If there's a modified_hours exception, use those hours
    if (exception && exception.type === 'modified_hours') {
      const start = new Date(`${date}T${exception.startTime}:00`)
      const end = new Date(`${date}T${exception.endTime}:00`)
      return [{ start, end }]
    }
    
    // Determine which schedule to use (employee or business)
    let daySchedule: DaySchedule | null = null
    
    // Check employee's custom working hours first
    if (employee.workingHours) {
      const employeeHours = employee.workingHours as any
      
      // Check if the structure has start/end instead of openTime/closeTime
      if (employeeHours[dayName]) {
        const schedule = employeeHours[dayName]
        if (schedule.start && schedule.end) {
          // Employee hours format
          daySchedule = {
            isOpen: true,
            openTime: schedule.start,
            closeTime: schedule.end,
            hasLunchBreak: schedule.hasLunchBreak,
            lunchStart: schedule.lunchStart,
            lunchEnd: schedule.lunchEnd,
          }
        } else if (schedule.open && schedule.close) {
          // Business hours format
          daySchedule = {
            isOpen: true,
            openTime: schedule.open,
            closeTime: schedule.close,
            hasLunchBreak: !!schedule.lunchStart,
            lunchStart: schedule.lunchStart,
            lunchEnd: schedule.lunchEnd,
          }
        }
      } else {
        // Employee has custom hours defined but not for this day - they don't work
        return []
      }
    }
    
    // Fall back to business hours only if employee has no custom hours at all
    if (!daySchedule && !employee.workingHours) {
      const businessHours = business.businessHours as any
      if (businessHours[dayName]) {
        const schedule = businessHours[dayName]
        if (schedule.open && schedule.close) {
          daySchedule = {
            isOpen: true,
            openTime: schedule.open,
            closeTime: schedule.close,
            hasLunchBreak: !!schedule.lunchStart,
            lunchStart: schedule.lunchStart,
            lunchEnd: schedule.lunchEnd,
          }
        }
      }
    }
    
    // If no schedule found, employee doesn't work this day
    if (!daySchedule) {
      return []
    }
    
    // If closed, return empty
    if (!daySchedule.isOpen) {
      return []
    }
    
    const blocks: { start: Date; end: Date }[] = []
    
    // Create working block(s) based on schedule
    // Since DB uses Europe/Zurich timezone, we can use local times directly
    const openTime = new Date(`${date}T${daySchedule.openTime}:00`)
    const closeTime = new Date(`${date}T${daySchedule.closeTime}:00`)
    
    // Check for lunch break
    if (daySchedule.hasLunchBreak && daySchedule.lunchStart && daySchedule.lunchEnd) {
      const lunchStart = new Date(`${date}T${daySchedule.lunchStart}:00`)
      const lunchEnd = new Date(`${date}T${daySchedule.lunchEnd}:00`)
      
      // Morning block (before lunch)
      blocks.push({ start: openTime, end: lunchStart })
      
      // Afternoon block (after lunch)
      blocks.push({ start: lunchEnd, end: closeTime })
    } else {
      // Single block for the whole day
      blocks.push({ start: openTime, end: closeTime })
    }
    
    return blocks
  }

  // Generate time slots within a working block
  private static generateSlotsForBlock(params: {
    block: { start: Date; end: Date }
    appointments: any[]
    serviceDuration: number
    bufferBefore: number
    bufferAfter: number
    totalDuration: number
    employeeId: string
    employeeName?: string
  }): TimeSlot[] {
    const { 
      block, 
      appointments, 
      serviceDuration, 
      bufferBefore,
      bufferAfter,
      totalDuration, 
      employeeId, 
      employeeName 
    } = params
    
    const slots: TimeSlot[] = []
    const slotDuration = 15 // Generate slots every 15 minutes
    
    // Sort appointments by start time
    const sortedAppointments = appointments
      .filter(apt => apt.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    
    // Start from the beginning of the block
    let currentTime = new Date(block.start)
    
    // Continue until we can't fit the service anymore
    while (currentTime.getTime() + totalDuration * 60000 <= block.end.getTime()) {
      const slotStart = new Date(currentTime)
      const actualStart = new Date(slotStart.getTime() - bufferBefore * 60000)
      const actualEnd = new Date(slotStart.getTime() + (serviceDuration + bufferAfter) * 60000)
      
      // Check if this slot conflicts with any appointments
      let isAvailable = true
      
      for (const appointment of sortedAppointments) {
        // For each appointment, consider its buffer times as well
        const aptService = appointment.service
        const aptBufferBefore = aptService?.bufferBefore || 0
        const aptBufferAfter = aptService?.bufferAfter || 0
        
        const aptActualStart = new Date(new Date(appointment.startTime).getTime() - aptBufferBefore * 60000)
        const aptActualEnd = new Date(new Date(appointment.endTime).getTime() + aptBufferAfter * 60000)
        
        // Check for overlap
        if (actualStart < aptActualEnd && actualEnd > aptActualStart) {
          isAvailable = false
          break
        }
      }
      
      // Add the slot if it's available
      if (isAvailable) {
        slots.push({
          startTime: slotStart.toISOString(),
          endTime: new Date(slotStart.getTime() + serviceDuration * 60000).toISOString(),
          employeeId,
          employeeName,
          available: true,
        })
      }
      
      // Move to next potential slot
      currentTime = new Date(currentTime.getTime() + slotDuration * 60000)
    }
    
    return slots
  }

  // Check if a specific time slot is available
  static async isSlotAvailable(params: {
    businessId: string
    employeeId: string
    serviceId: string
    startTime: string
  }): Promise<boolean> {
    // Get service details
    const service = await ServiceService.getById(params.serviceId)
    
    // Calculate actual start and end times with buffers
    const appointmentStart = new Date(params.startTime)
    const actualStart = new Date(appointmentStart.getTime() - service.bufferBefore * 60000)
    const actualEnd = new Date(
      appointmentStart.getTime() + (service.duration + service.bufferAfter) * 60000
    )
    
    // Get the date
    const date = params.startTime.split('T')[0]
    
    // Check working hours
    const workingBlocks = await this.getEmployeeWorkingBlocks({
      businessId: params.businessId,
      employeeId: params.employeeId,
      date,
    })
    
    // Check if the slot fits within any working block
    let fitsInWorkingHours = false
    for (const block of workingBlocks) {
      if (actualStart >= block.start && actualEnd <= block.end) {
        fitsInWorkingHours = true
        break
      }
    }
    
    if (!fitsInWorkingHours) {
      return false
    }
    
    // Check for conflicts with existing appointments
    const appointments = await AppointmentService.getByDateAndEmployee(
      params.businessId,
      date,
      params.employeeId
    )
    
    for (const appointment of appointments) {
      const aptService = appointment.service
      const aptBufferBefore = aptService?.bufferBefore || 0
      const aptBufferAfter = aptService?.bufferAfter || 0
      
      const aptActualStart = new Date(new Date(appointment.startTime).getTime() - aptBufferBefore * 60000)
      const aptActualEnd = new Date(new Date(appointment.endTime).getTime() + aptBufferAfter * 60000)
      
      // Check for overlap
      if (actualStart < aptActualEnd && actualEnd > aptActualStart) {
        return false
      }
    }
    
    return true
  }

  // Get available dates for a service (for calendar view)
  static async getAvailableDates(params: {
    businessId: string
    serviceId: string
    startDate: string
    endDate: string
    employeeId?: string
  }): Promise<DayAvailability[]> {
    const { businessId, serviceId, startDate, endDate, employeeId } = params
    
    const availableDates: DayAvailability[] = []
    const currentDate = new Date(startDate)
    const end = new Date(endDate)
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      // Check if any slots are available on this date
      const slots = await this.getAvailableSlots({
        businessId,
        serviceId,
        date: dateStr,
        employeeId,
      })
      
      availableDates.push({
        date: dateStr,
        hasAvailability: slots.length > 0,
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return availableDates
  }

  // Helper method to parse time string (HH:MM) to minutes
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Helper method to convert minutes to time string (HH:MM)
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Helper method to get day of week (0 = Monday, 6 = Sunday)
  private static getDayOfWeek(date: string): number {
    const d = new Date(date)
    const day = d.getDay()
    return day === 0 ? 6 : day - 1 // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  }
}