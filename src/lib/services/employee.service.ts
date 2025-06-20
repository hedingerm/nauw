import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/lib/supabase/database.types'
import { createEmployeeSchema, updateEmployeeSchema } from '@/src/lib/schemas/employee'
import { z } from 'zod'

type Employee = Database['public']['Tables']['Employee']['Row']
type EmployeeInsert = Database['public']['Tables']['Employee']['Insert']
type EmployeeUpdate = Database['public']['Tables']['Employee']['Update']

interface EmployeeWithServices extends Employee {
  employeeServices?: Array<{
    id: string
    employeeId: string
    serviceId: string
    service?: Database['public']['Tables']['Service']['Row']
  }>
  serviceIds: string[]
}

export class EmployeeService {
  private static async getClient() {
    return createClient()
  }

  static async list(businessId: string): Promise<EmployeeWithServices[]> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Employee')
      .select(`
        *,
        EmployeeService(
          *,
          Service(*)
        )
      `)
      .eq('businessId', businessId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching employees:', error)
      throw new Error(error.message)
    }

    // Transform the data to match the expected format
    return (data || []).map(employee => ({
      ...employee,
      employeeServices: employee.EmployeeService?.map((es: any) => ({
        ...es,
        service: es.Service
      })) || [],
      serviceIds: employee.EmployeeService?.map((es: any) => es.serviceId) || []
    }))
  }

  static async listActive(businessId: string): Promise<EmployeeWithServices[]> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Employee')
      .select(`
        *,
        EmployeeService(
          *,
          Service(*)
        )
      `)
      .eq('businessId', businessId)
      .eq('isActive', true)
      .eq('canPerformServices', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching active employees:', error)
      throw new Error(error.message)
    }

    // Transform the data to match the expected format
    return (data || []).map(employee => ({
      ...employee,
      employeeServices: employee.EmployeeService?.map((es: any) => ({
        ...es,
        service: es.Service
      })) || [],
      serviceIds: employee.EmployeeService?.map((es: any) => es.serviceId) || []
    }))
  }

  static async getById(id: string): Promise<EmployeeWithServices> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Employee')
      .select(`
        *,
        EmployeeService(
          *,
          Service(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching employee:', error)
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('Mitarbeiter nicht gefunden')
    }

    // Transform the data to match the expected format
    return {
      ...data,
      employeeServices: data.EmployeeService?.map((es: any) => ({
        ...es,
        service: es.Service
      })) || [],
      serviceIds: data.EmployeeService?.map((es: any) => es.serviceId) || []
    }
  }

  static async create(
    businessId: string, 
    data: z.infer<typeof createEmployeeSchema>
  ): Promise<Employee> {
    const supabase = await this.getClient()
    const { serviceIds, ...employeeData } = data

    // Check if email already exists
    const { data: existingEmployee } = await supabase
      .from('Employee')
      .select('id')
      .eq('email', employeeData.email)
      .single()

    if (existingEmployee) {
      throw new Error('Ein Mitarbeiter mit dieser E-Mail existiert bereits')
    }

    // Create employee
    const { data: employee, error } = await supabase
      .from('Employee')
      .insert({
        ...employeeData,
        businessId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating employee:', error)
      throw new Error(error.message)
    }

    // Create service associations
    if (serviceIds && serviceIds.length > 0 && employee) {
      const employeeServices = serviceIds.map(serviceId => ({
        employeeId: employee.id,
        serviceId,
      }))

      const { error: serviceError } = await supabase
        .from('EmployeeService')
        .insert(employeeServices)

      if (serviceError) {
        // Rollback employee creation
        await supabase.from('Employee').delete().eq('id', employee.id)
        throw new Error(serviceError.message)
      }
    }

    return employee
  }

  static async update(
    id: string,
    data: z.infer<typeof updateEmployeeSchema>
  ): Promise<Employee> {
    const supabase = await this.getClient()
    const { serviceIds, ...employeeData } = data

    // Update employee
    const { data: employee, error } = await supabase
      .from('Employee')
      .update(employeeData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating employee:', error)
      throw new Error(error.message)
    }

    // Update service associations if provided
    if (serviceIds !== undefined) {
      // Delete existing associations
      await supabase
        .from('EmployeeService')
        .delete()
        .eq('employeeId', id)

      // Create new associations
      if (serviceIds.length > 0) {
        const employeeServices = serviceIds.map(serviceId => ({
          employeeId: id,
          serviceId,
        }))

        const { error: serviceError } = await supabase
          .from('EmployeeService')
          .insert(employeeServices)

        if (serviceError) {
          throw new Error(serviceError.message)
        }
      }
    }

    return employee
  }

  static async delete(id: string): Promise<void> {
    const supabase = await this.getClient()
    
    // Check if employee has appointments
    const { data: appointments } = await supabase
      .from('Appointment')
      .select('id')
      .eq('employeeId', id)
      .in('status', ['confirmed', 'pending'])
      .limit(1)

    if (appointments && appointments.length > 0) {
      throw new Error('Mitarbeiter kann nicht gelöscht werden, da noch Termine vorhanden sind')
    }

    const { error } = await supabase
      .from('Employee')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting employee:', error)
      throw new Error(error.message)
    }
  }

  static async toggleActive(id: string): Promise<Employee> {
    const supabase = await this.getClient()
    
    const { data: employee } = await supabase
      .from('Employee')
      .select('isActive')
      .eq('id', id)
      .single()

    if (!employee) {
      throw new Error('Mitarbeiter nicht gefunden')
    }

    const { data: updatedEmployee, error } = await supabase
      .from('Employee')
      .update({ isActive: !employee.isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling employee:', error)
      throw new Error(error.message)
    }

    return updatedEmployee
  }

  static async getByService(serviceId: string): Promise<Employee[]> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('EmployeeService')
      .select(`
        Employee(*)
      `)
      .eq('serviceId', serviceId)

    if (error) {
      console.error('Error fetching employees by service:', error)
      throw new Error(error.message)
    }

    // Extract employees from the join result
    return (data || [])
      .map((item: any) => item.Employee)
      .filter((employee: any) => employee !== null) as Employee[]
  }
}