import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/lib/supabase/database.types'
import { 
  createAppointmentSchema,
  createBookingSchema,
  updateAppointmentSchema,
  filterAppointmentsSchema,
  type CreateAppointmentInput,
  type CreateBookingInput,
  type UpdateAppointmentInput,
  type FilterAppointmentsInput,
  type AppointmentWithRelations,
  type AppointmentStatus
} from '@/src/lib/schemas/appointment'
import { CustomerService } from './customer.service'
import { ServiceService } from './service.service'
import { BusinessService } from './business.service'
import { z } from 'zod'

type Appointment = Database['public']['Tables']['Appointment']['Row']
type AppointmentInsert = Database['public']['Tables']['Appointment']['Insert']
type AppointmentUpdate = Database['public']['Tables']['Appointment']['Update']

export class AppointmentService {
  private static async getClient() {
    return createClient()
  }

  // Simple create method for customer booking
  static async createSimple(data: {
    businessId: string
    customerId: string
    employeeId: string
    serviceId: string
    date: string
    startTime: string
    duration: number
    bufferBefore: number
    bufferAfter: number
    price: number
    notes?: string
    status: 'pending' | 'confirmed'
  }): Promise<Appointment> {
    const supabase = await this.getClient()
    
    // Calculate actual start and end times including buffers
    const [hours, minutes] = data.startTime.split(':').map(Number)
    const appointmentDate = new Date(data.date)
    appointmentDate.setHours(hours, minutes, 0, 0)
    
    // Start time includes buffer before
    const actualStartTime = new Date(appointmentDate.getTime() - data.bufferBefore * 60000)
    const actualStartTimeStr = this.formatLocalTimestamp(actualStartTime)
    
    // End time includes service duration and buffer after
    const totalDuration = data.duration + data.bufferBefore + data.bufferAfter
    const endTime = this.calculateEndTime(actualStartTimeStr, totalDuration)
    
    // Check for conflicts
    const hasConflict = await this.checkConflicts(
      data.businessId,
      data.employeeId,
      actualStartTimeStr,
      endTime
    )
    
    if (hasConflict) {
      throw new Error('Dieser Termin ist nicht mehr verfügbar')
    }
    
    // Create appointment
    const { data: appointment, error } = await supabase
      .from('Appointment')
      .insert({
        businessId: data.businessId,
        customerId: data.customerId,
        employeeId: data.employeeId,
        serviceId: data.serviceId,
        startTime: actualStartTimeStr,
        endTime: endTime,
        status: data.status,
        notes: data.notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      throw new Error('Fehler beim Erstellen des Termins')
    }

    return appointment
  }

  // Helper function to format date as ISO string preserving the local time
  private static formatLocalTimestamp(date: Date): string {
    // Get the local time components
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    // Return as timestamp without timezone (will be interpreted as local time by the database)
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }

  // Helper function to calculate end time
  private static calculateEndTime(startTime: string, durationMinutes: number): string {
    const start = new Date(startTime)
    const end = new Date(start.getTime() + durationMinutes * 60000)
    return this.formatLocalTimestamp(end)
  }

  // Check for appointment conflicts
  private static async checkConflicts(
    businessId: string,
    employeeId: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const supabase = await this.getClient()
    
    let query = supabase
      .from('Appointment')
      .select('id, startTime, endTime')
      .eq('businessId', businessId)
      .eq('employeeId', employeeId)
      .in('status', ['pending', 'confirmed'])
      .lt('startTime', endTime)
      .gt('endTime', startTime)
    
    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error checking conflicts:', error)
      throw new Error('Fehler bei der Konfliktprüfung')
    }
    
    return (data || []).length > 0
  }

  // Create appointment (manual booking by business)
  static async create(businessId: string, data: CreateAppointmentInput): Promise<Appointment> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedData = createAppointmentSchema.parse(data)
    
    // Get service details for duration
    const service = await ServiceService.getById(validatedData.serviceId)
    
    // Calculate end time including buffer times
    const totalDuration = service.duration + service.bufferBefore + service.bufferAfter
    const appointmentStartTime = new Date(validatedData.startTime)
    const actualStartTime = new Date(appointmentStartTime.getTime() - service.bufferBefore * 60000)
    const actualStartTimeStr = this.formatLocalTimestamp(actualStartTime)
    const endTime = this.calculateEndTime(actualStartTimeStr, totalDuration)
    
    // Check for conflicts
    const hasConflict = await this.checkConflicts(
      businessId,
      validatedData.employeeId,
      actualStartTimeStr,
      endTime
    )
    
    if (hasConflict) {
      throw new Error('Dieser Termin überschneidet sich mit einem anderen Termin')
    }
    
    // Handle customer creation/lookup
    let customerId = validatedData.customerId
    
    if (!customerId && validatedData.customerData) {
      const customer = await CustomerService.getOrCreate(businessId, validatedData.customerData)
      customerId = customer.id
    }
    
    if (!customerId) {
      throw new Error('Kunde muss angegeben werden')
    }
    
    // Create appointment
    const { data: appointment, error } = await supabase
      .from('Appointment')
      .insert({
        businessId,
        customerId,
        employeeId: validatedData.employeeId,
        serviceId: validatedData.serviceId,
        startTime: actualStartTimeStr,
        endTime: endTime,
        status: validatedData.status || 'confirmed',
        notes: validatedData.notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      throw new Error('Fehler beim Erstellen des Termins')
    }

    return appointment
  }

  // Create booking (customer self-booking)
  static async createBooking(businessId: string, data: CreateBookingInput): Promise<Appointment> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedData = createBookingSchema.parse(data)
    
    // Get service details
    const service = await ServiceService.getById(validatedData.serviceId)
    
    // If no employee specified, find available employee
    let employeeId = validatedData.employeeId
    
    if (!employeeId) {
      // TODO: This will be implemented with AvailabilityService
      // For now, require employee selection
      throw new Error('Mitarbeiter muss ausgewählt werden')
    }
    
    // Create or get customer
    const customer = await CustomerService.getOrCreate(businessId, validatedData.customer)
    
    // Check if business accepts appointments automatically
    const business = await BusinessService.getById(businessId)
    const status = business.acceptAppointmentsAutomatically ? 'confirmed' : 'pending'
    
    // Create appointment with appropriate status
    return this.create(businessId, {
      customerId: customer.id,
      employeeId,
      serviceId: validatedData.serviceId,
      startTime: validatedData.startTime,
      status,
    })
  }

  static async getById(id: string): Promise<AppointmentWithRelations> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Appointment')
      .select(`
        *,
        customer:Customer(id, name, email, phone),
        employee:Employee(id, name, email),
        service:Service(id, name, duration, price)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching appointment:', error)
      throw new Error('Fehler beim Abrufen des Termins')
    }

    if (!data) {
      throw new Error('Termin nicht gefunden')
    }

    return data as unknown as AppointmentWithRelations
  }

  static async update(id: string, data: UpdateAppointmentInput): Promise<Appointment> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedData = updateAppointmentSchema.parse(data)
    
    // If updating time or employee, check for conflicts
    if (validatedData.startTime || validatedData.employeeId) {
      const current = await this.getById(id)
      
      const newStartTime = validatedData.startTime || current.startTime
      const newEmployeeId = validatedData.employeeId || current.employeeId
      
      // Recalculate end time if start time changed
      let newEndTime = current.endTime
      if (validatedData.startTime && current.service) {
        newEndTime = this.calculateEndTime(newStartTime, current.service.duration)
      }
      
      const hasConflict = await this.checkConflicts(
        current.businessId,
        newEmployeeId,
        newStartTime,
        newEndTime,
        id
      )
      
      if (hasConflict) {
        throw new Error('Die Änderung würde zu einer Terminüberschneidung führen')
      }
    }
    
    const updateData: AppointmentUpdate = { ...validatedData }
    
    // Update end time if start time changed
    if (validatedData.startTime) {
      const appointment = await this.getById(id)
      if (appointment.service) {
        updateData.endTime = this.calculateEndTime(
          validatedData.startTime,
          appointment.service.duration
        )
      }
    }
    
    const { data: appointment, error } = await supabase
      .from('Appointment')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating appointment:', error)
      throw new Error('Fehler beim Aktualisieren des Termins')
    }

    return appointment
  }

  static async cancel(id: string, reason?: string): Promise<Appointment> {
    return this.update(id, {
      status: 'cancelled',
      notes: reason,
    })
  }

  static async confirm(id: string): Promise<Appointment> {
    return this.update(id, {
      status: 'confirmed',
    })
  }

  static async complete(id: string): Promise<Appointment> {
    return this.update(id, {
      status: 'completed',
    })
  }

  static async markNoShow(id: string): Promise<Appointment> {
    return this.update(id, {
      status: 'no_show',
    })
  }

  static async delete(id: string): Promise<void> {
    const supabase = await this.getClient()
    
    const { error } = await supabase
      .from('Appointment')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting appointment:', error)
      throw new Error('Fehler beim Löschen des Termins')
    }
  }

  static async list(input: FilterAppointmentsInput): Promise<AppointmentWithRelations[]> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedInput = filterAppointmentsSchema.parse(input)
    
    let query = supabase
      .from('Appointment')
      .select(`
        *,
        customer:Customer(id, name, email, phone),
        employee:Employee(id, name, email),
        service:Service(id, name, duration, price)
      `)
    
    // Apply filters
    if (validatedInput.businessId) {
      query = query.eq('businessId', validatedInput.businessId)
    }
    
    if (validatedInput.customerId) {
      query = query.eq('customerId', validatedInput.customerId)
    }
    
    if (validatedInput.employeeId) {
      query = query.eq('employeeId', validatedInput.employeeId)
    }
    
    if (validatedInput.serviceId) {
      query = query.eq('serviceId', validatedInput.serviceId)
    }
    
    if (validatedInput.status && validatedInput.status.length > 0) {
      query = query.in('status', validatedInput.status)
    }
    
    // Date filters
    if (validatedInput.date) {
      const startOfDay = new Date(validatedInput.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(validatedInput.date)
      endOfDay.setHours(23, 59, 59, 999)
      
      query = query
        .gte('startTime', this.formatLocalTimestamp(startOfDay))
        .lt('startTime', this.formatLocalTimestamp(endOfDay))
    } else {
      if (validatedInput.dateFrom) {
        query = query.gte('startTime', validatedInput.dateFrom)
      }
      
      if (validatedInput.dateTo) {
        query = query.lte('startTime', validatedInput.dateTo)
      }
    }
    
    // Order by start time
    query = query.order('startTime', { ascending: true })
    
    const { data, error } = await query

    if (error) {
      console.error('Error listing appointments:', error)
      throw new Error('Fehler beim Abrufen der Termine')
    }

    return (data || []) as unknown as AppointmentWithRelations[]
  }

  // Get appointments for a specific day and employee
  static async getByDateAndEmployee(
    businessId: string,
    date: string,
    employeeId?: string
  ): Promise<AppointmentWithRelations[]> {
    const appointments = await this.list({
      businessId,
      date,
      employeeId,
      status: ['pending', 'confirmed'],
    })
    return appointments
  }

  // Get upcoming appointments count for dashboard
  static async getUpcomingCount(businessId: string): Promise<number> {
    const supabase = await this.getClient()
    
    const now = this.formatLocalTimestamp(new Date())
    
    const { count, error } = await supabase
      .from('Appointment')
      .select('*', { count: 'exact', head: true })
      .eq('businessId', businessId)
      .in('status', ['pending', 'confirmed'])
      .gte('startTime', now)

    if (error) {
      console.error('Error counting appointments:', error)
      return 0
    }

    return count || 0
  }

  // Get today's appointments for dashboard
  static async getTodaysAppointments(businessId: string): Promise<AppointmentWithRelations[]> {
    const supabase = await this.getClient()
    
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)
    
    const { data, error } = await supabase
      .from('Appointment')
      .select(`
        *,
        Customer(*),
        Employee(*),
        Service(*)
      `)
      .eq('businessId', businessId)
      .gte('startTime', todayStart.toISOString())
      .lt('startTime', todayEnd.toISOString())
      .in('status', ['pending', 'confirmed'])
      .order('startTime', { ascending: true })

    if (error) {
      console.error('Error fetching today appointments:', error)
      return []
    }

    return data || []
  }

  // Get upcoming appointments for next N days
  static async getUpcomingAppointments(businessId: string, days: number = 7): Promise<AppointmentWithRelations[]> {
    const supabase = await this.getClient()
    
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    startDate.setDate(startDate.getDate() + 1) // Start from tomorrow
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + days)
    
    const { data, error } = await supabase
      .from('Appointment')
      .select(`
        *,
        Customer(*),
        Employee(*),
        Service(*)
      `)
      .eq('businessId', businessId)
      .gte('startTime', startDate.toISOString())
      .lt('startTime', endDate.toISOString())
      .in('status', ['pending', 'confirmed'])
      .order('startTime', { ascending: true })
      .limit(20) // Limit to prevent too much data

    if (error) {
      console.error('Error fetching upcoming appointments:', error)
      return []
    }

    return data || []
  }

  // Get recent appointments for activity feed
  static async getRecentAppointments(businessId: string, limit: number = 10): Promise<AppointmentWithRelations[]> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Appointment')
      .select(`
        *,
        Customer(*),
        Employee(*),
        Service(*)
      `)
      .eq('businessId', businessId)
      .order('createdAt', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent appointments:', error)
      return []
    }

    return data || []
  }

  // Calculate revenue data for dashboard
  static async getRevenueStats(businessId: string): Promise<{
    todayRevenue: number
    weekRevenue: number
    monthRevenue: number
    averageBookingValue: number
  }> {
    const supabase = await this.getClient()
    
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Get appointments with service data for pricing
    const { data: todayData } = await supabase
      .from('Appointment')
      .select('*, Service(price)')
      .eq('businessId', businessId)
      .gte('startTime', todayStart.toISOString())
      .in('status', ['confirmed', 'completed'])

    const { data: weekData } = await supabase
      .from('Appointment')
      .select('*, Service(price)')
      .eq('businessId', businessId)
      .gte('startTime', weekStart.toISOString())
      .in('status', ['confirmed', 'completed'])

    const { data: monthData } = await supabase
      .from('Appointment')
      .select('*, Service(price)')
      .eq('businessId', businessId)
      .gte('startTime', monthStart.toISOString())
      .in('status', ['confirmed', 'completed'])

    // Calculate revenues
    const calculateRevenue = (appointments: any[]) => {
      return appointments?.reduce((sum, apt) => sum + (apt.Service?.price || 0), 0) || 0
    }

    const todayRevenue = calculateRevenue(todayData || [])
    const weekRevenue = calculateRevenue(weekData || [])
    const monthRevenue = calculateRevenue(monthData || [])
    const averageBookingValue = monthData?.length ? monthRevenue / monthData.length : 0

    return {
      todayRevenue,
      weekRevenue,
      monthRevenue,
      averageBookingValue: Math.round(averageBookingValue * 100) / 100
    }
  }

  // Get appointment statistics for reports
  static async getAppointmentStats(businessId: string, period: 'week' | 'month' | 'year'): Promise<{
    total: number
    completed: number
    cancelled: number
    pending: number
  }> {
    const supabase = await this.getClient()
    
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }
    
    const { data, error } = await supabase
      .from('Appointment')
      .select('status')
      .eq('businessId', businessId)
      .gte('startTime', startDate.toISOString())
    
    if (error || !data) {
      console.error('Error fetching appointment stats:', error)
      return { total: 0, completed: 0, cancelled: 0, pending: 0 }
    }
    
    const stats = {
      total: data.length,
      completed: data.filter(a => a.status === 'completed').length,
      cancelled: data.filter(a => a.status === 'cancelled').length,
      pending: data.filter(a => a.status === 'pending').length,
    }
    
    return stats
  }
}