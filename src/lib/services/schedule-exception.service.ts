import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/lib/supabase/database.types'
import {
  createScheduleExceptionSchema,
  createScheduleExceptionRangeSchema,
  updateScheduleExceptionSchema,
  filterScheduleExceptionsSchema,
  type CreateScheduleExceptionInput,
  type CreateScheduleExceptionRangeInput,
  type UpdateScheduleExceptionInput,
  type FilterScheduleExceptionsInput,
  type ScheduleExceptionWithRelations,
  type ExceptionType
} from '@/src/lib/schemas/schedule-exception'
import { z } from 'zod'

type ScheduleException = Database['public']['Tables']['ScheduleException']['Row']
type ScheduleExceptionInsert = Database['public']['Tables']['ScheduleException']['Insert']
type ScheduleExceptionUpdate = Database['public']['Tables']['ScheduleException']['Update']

export class ScheduleExceptionService {
  private static async getClient() {
    return createClient()
  }

  static async create(data: CreateScheduleExceptionInput): Promise<ScheduleException> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedData = createScheduleExceptionSchema.parse(data)
    
    // Check for existing exception on the same date
    const { data: existingException } = await supabase
      .from('ScheduleException')
      .select('id')
      .eq('employeeId', validatedData.employeeId)
      .eq('date', validatedData.date)
      .single()
    
    if (existingException) {
      throw new Error('Für dieses Datum existiert bereits eine Ausnahme')
    }
    
    const insertData: ScheduleExceptionInsert = {
      employeeId: validatedData.employeeId,
      date: validatedData.date,
      type: validatedData.type,
      reason: validatedData.reason,
      startTime: validatedData.type === 'modified_hours' ? validatedData.startTime : null,
      endTime: validatedData.type === 'modified_hours' ? validatedData.endTime : null,
    }
    
    const { data: exception, error } = await supabase
      .from('ScheduleException')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating schedule exception:', error)
      throw new Error('Fehler beim Erstellen der Zeitplan-Ausnahme')
    }

    return exception
  }

  static async createRange(data: CreateScheduleExceptionRangeInput): Promise<ScheduleException[]> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedData = createScheduleExceptionRangeSchema.parse(data)
    
    // Generate dates for the range
    const dates: string[] = []
    const currentDate = new Date(validatedData.dateFrom)
    const endDate = new Date(validatedData.dateTo)
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Check for existing exceptions in the date range
    const { data: existingExceptions } = await supabase
      .from('ScheduleException')
      .select('date')
      .eq('employeeId', validatedData.employeeId)
      .in('date', dates)
    
    if (existingExceptions && existingExceptions.length > 0) {
      const existingDates = existingExceptions.map(e => e.date)
      throw new Error(`Es existieren bereits Ausnahmen für folgende Tage: ${existingDates.join(', ')}`)
    }
    
    // Create exceptions for each date
    const exceptions: ScheduleExceptionInsert[] = dates.map(date => ({
      employeeId: validatedData.employeeId,
      date,
      type: 'unavailable',
      reason: validatedData.reason,
    }))
    
    const { data: createdExceptions, error } = await supabase
      .from('ScheduleException')
      .insert(exceptions)
      .select()

    if (error) {
      console.error('Error creating schedule exception range:', error)
      throw new Error('Fehler beim Erstellen der Zeitplan-Ausnahmen')
    }

    return createdExceptions || []
  }

  static async createForAllEmployees(data: {
    businessId: string
    date: string
    dateRangeEnd?: string
    type: 'unavailable' | 'holiday'
    reason: string
    employeeIds?: string[] // Optional: specific employees only
  }): Promise<{ created: number; skipped: number; employees: string[] }> {
    const supabase = await this.getClient()
    
    // Generate dates for the range
    const dates: string[] = []
    const startDate = new Date(data.date)
    const endDate = data.dateRangeEnd ? new Date(data.dateRangeEnd) : new Date(data.date)
    
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Get active employees for this business
    const { data: employees } = await supabase
      .from('Employee')
      .select('id, name')
      .eq('businessId', data.businessId)
      .eq('isActive', true)
      .eq('canPerformServices', true)
    
    if (!employees || employees.length === 0) {
      throw new Error('Keine aktiven Mitarbeiter gefunden')
    }
    
    // Filter employees if specific ones are selected
    const targetEmployees = data.employeeIds && data.employeeIds.length > 0
      ? employees.filter(e => data.employeeIds!.includes(e.id))
      : employees
    
    // Check existing exceptions for all employees and dates
    const { data: existingExceptions } = await supabase
      .from('ScheduleException')
      .select('employeeId, date')
      .in('employeeId', targetEmployees.map(e => e.id))
      .in('date', dates)
    
    // Create a set of existing exception keys for quick lookup
    const existingKeys = new Set(
      (existingExceptions || []).map(e => `${e.employeeId}-${e.date}`)
    )
    
    // Prepare exceptions to create
    const exceptionsToCreate: ScheduleExceptionInsert[] = []
    let skippedCount = 0
    
    for (const employee of targetEmployees) {
      for (const date of dates) {
        const key = `${employee.id}-${date}`
        if (existingKeys.has(key)) {
          skippedCount++
        } else {
          exceptionsToCreate.push({
            employeeId: employee.id,
            date,
            type: 'unavailable', // Always use 'unavailable' for storage
            reason: data.reason,
          })
        }
      }
    }
    
    if (exceptionsToCreate.length === 0) {
      return {
        created: 0,
        skipped: skippedCount,
        employees: targetEmployees.map(e => e.name)
      }
    }
    
    // Create all exceptions
    const { data: createdExceptions, error } = await supabase
      .from('ScheduleException')
      .insert(exceptionsToCreate)
      .select()
    
    if (error) {
      console.error('Error creating schedule exceptions for all employees:', error)
      throw new Error('Fehler beim Erstellen der Zeitplan-Ausnahmen')
    }
    
    return {
      created: createdExceptions?.length || 0,
      skipped: skippedCount,
      employees: targetEmployees.map(e => e.name)
    }
  }

  static async getById(id: string): Promise<ScheduleException> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('ScheduleException')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching schedule exception:', error)
      throw new Error('Fehler beim Abrufen der Zeitplan-Ausnahme')
    }

    if (!data) {
      throw new Error('Zeitplan-Ausnahme nicht gefunden')
    }

    return data
  }

  static async update(id: string, data: UpdateScheduleExceptionInput): Promise<ScheduleException> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedData = updateScheduleExceptionSchema.parse(data)
    
    const { data: exception, error } = await supabase
      .from('ScheduleException')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating schedule exception:', error)
      throw new Error('Fehler beim Aktualisieren der Zeitplan-Ausnahme')
    }

    return exception
  }

  static async delete(id: string): Promise<void> {
    const supabase = await this.getClient()
    
    // Check if the exception date has passed
    const exception = await this.getById(id)
    const exceptionDate = new Date(exception.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (exceptionDate < today) {
      throw new Error('Vergangene Ausnahmen können nicht gelöscht werden')
    }
    
    const { error } = await supabase
      .from('ScheduleException')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting schedule exception:', error)
      throw new Error('Fehler beim Löschen der Zeitplan-Ausnahme')
    }
  }

  static async list(input: FilterScheduleExceptionsInput): Promise<ScheduleExceptionWithRelations[]> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedInput = filterScheduleExceptionsSchema.parse(input)
    
    let query = supabase
      .from('ScheduleException')
      .select(`
        *,
        employee:Employee(id, name, email)
      `)
    
    // Apply filters
    if (validatedInput.employeeId) {
      query = query.eq('employeeId', validatedInput.employeeId)
    }
    
    if (validatedInput.businessId) {
      query = query.eq('employee.businessId', validatedInput.businessId)
    }
    
    if (validatedInput.type && validatedInput.type.length > 0) {
      query = query.in('type', validatedInput.type)
    }
    
    // Date filters
    if (validatedInput.month) {
      const [year, month] = validatedInput.month.split('-')
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      
      query = query
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
    } else {
      if (validatedInput.dateFrom) {
        query = query.gte('date', validatedInput.dateFrom)
      }
      
      if (validatedInput.dateTo) {
        query = query.lte('date', validatedInput.dateTo)
      }
    }
    
    // Order by date
    query = query.order('date', { ascending: true })
    
    const { data, error } = await query

    if (error) {
      console.error('Error listing schedule exceptions:', error)
      throw new Error('Fehler beim Abrufen der Zeitplan-Ausnahmen')
    }

    return (data || []) as unknown as ScheduleExceptionWithRelations[]
  }

  // Get exceptions for a specific employee and date range
  static async getByEmployeeAndDateRange(
    employeeId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<ScheduleException[]> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('ScheduleException')
      .select('*')
      .eq('employeeId', employeeId)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching employee exceptions:', error)
      throw new Error('Fehler beim Abrufen der Mitarbeiter-Ausnahmen')
    }

    return data || []
  }

  // Check if employee is available on a specific date
  static async isEmployeeAvailable(
    employeeId: string,
    date: string
  ): Promise<{ available: boolean; exception?: ScheduleException }> {
    const supabase = await this.getClient()
    
    const { data: exceptions, error } = await supabase
      .from('ScheduleException')
      .select('*')
      .eq('employeeId', employeeId)
      .eq('date', date)
    
    if (error) {
      console.error('Error checking employee availability:', error)
      // If there's an error, assume employee is available
      return { available: true }
    }
    
    const exception = exceptions?.[0]
    
    if (!exception) {
      return { available: true }
    }
    
    if (exception.type === 'unavailable') {
      return { available: false, exception }
    }
    
    // For modified hours, employee is still available but with different hours
    return { available: true, exception }
  }

  // Get all holidays for a business (future feature)
  static async getHolidays(businessId: string, year: number): Promise<ScheduleException[]> {
    const supabase = await this.getClient()
    
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    
    const { data, error } = await supabase
      .from('ScheduleException')
      .select('*, employee!inner(businessId)')
      .eq('employee.businessId', businessId)
      .eq('type', 'holiday')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching holidays:', error)
      throw new Error('Fehler beim Abrufen der Feiertage')
    }

    return data || []
  }

  // Get consolidated exceptions grouped by date and reason
  static async getConsolidated(input: FilterScheduleExceptionsInput): Promise<ConsolidatedExceptionGroup[]> {
    const exceptions = await this.list(input)
    
    // Group exceptions by date and reason
    const groups = new Map<string, ConsolidatedExceptionGroup>()
    
    for (const exception of exceptions) {
      const key = `${exception.date}-${exception.reason || 'no-reason'}`
      
      if (!groups.has(key)) {
        groups.set(key, {
          date: exception.date,
          reason: exception.reason,
          type: exception.type,
          employeeIds: [],
          employeeNames: [],
          exceptions: []
        })
      }
      
      const group = groups.get(key)!
      group.employeeIds.push(exception.employeeId)
      if (exception.employee) {
        group.employeeNames.push(exception.employee.name)
      }
      group.exceptions.push(exception)
    }
    
    // Convert to array and sort by date
    return Array.from(groups.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }
}

// Type for consolidated exception groups
export interface ConsolidatedExceptionGroup {
  date: string
  reason: string | null
  type: ExceptionType
  employeeIds: string[]
  employeeNames: string[]
  exceptions: ScheduleExceptionWithRelations[]
}