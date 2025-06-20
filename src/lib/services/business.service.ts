import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/lib/supabase/database.types'
import { 
  type BusinessInfo,
  type BusinessHours as OnboardingBusinessHours,
  type EmployeeInfo,
  type ServiceInfo,
  type CompleteOnboardingData 
} from '@/src/lib/schemas/onboarding'

type Business = Database['public']['Tables']['Business']['Row']
type BusinessInsert = Database['public']['Tables']['Business']['Insert']
type Employee = Database['public']['Tables']['Employee']['Row']
type Service = Database['public']['Tables']['Service']['Row']

export class BusinessService {
  private static async getClient() {
    return createClient()
  }

  static async getCurrentBusiness(): Promise<Business | null> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Business')
      .select('*')
      .single()
    
    if (error) {
      console.error('Error fetching business:', error)
      return null
    }
    
    return data
  }

  static async getById(id: string): Promise<Business> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Business')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching business:', error)
      throw new Error('Geschäft nicht gefunden')
    }
    
    return data
  }

  static async getBusinessWithRelations(businessId: string) {
    const supabase = await this.getClient()
    
    const { data: business, error } = await supabase
      .from('Business')
      .select(`
        *,
        Service(*),
        Employee(*)
      `)
      .eq('id', businessId)
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return business
  }

  static async updateBusiness(id: string, data: Partial<BusinessInsert>) {
    const supabase = await this.getClient()
    
    const { data: business, error } = await supabase
      .from('Business')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return business
  }

  static async getStats(businessId: string) {
    const supabase = await this.getClient()
    
    // Get current date info
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)
    
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week (Sunday)
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Format dates for PostgreSQL
    const formatDate = (date: Date) => date.toISOString()
    
    const [
      services, 
      employees, 
      appointments, 
      customers,
      todayAppointments,
      weekAppointments,
      monthAppointments,
      pendingAppointments
    ] = await Promise.all([
      // Basic counts
      supabase.from('Service').select('id', { count: 'exact' }).eq('businessId', businessId),
      supabase.from('Employee').select('id', { count: 'exact' }).eq('businessId', businessId),
      supabase.from('Appointment').select('id', { count: 'exact' }).eq('businessId', businessId),
      supabase.from('Customer').select('id', { count: 'exact' }).eq('businessId', businessId),
      
      // Today's appointments
      supabase
        .from('Appointment')
        .select('id, status', { count: 'exact' })
        .eq('businessId', businessId)
        .gte('startTime', formatDate(todayStart))
        .lt('startTime', formatDate(todayEnd))
        .in('status', ['confirmed', 'pending']),
      
      // This week's appointments
      supabase
        .from('Appointment')
        .select('id', { count: 'exact' })
        .eq('businessId', businessId)
        .gte('startTime', formatDate(weekStart))
        .lt('startTime', formatDate(todayEnd))
        .in('status', ['confirmed', 'pending', 'completed']),
      
      // This month's appointments
      supabase
        .from('Appointment')
        .select('id', { count: 'exact' })
        .eq('businessId', businessId)
        .gte('startTime', formatDate(monthStart))
        .lt('startTime', formatDate(todayEnd))
        .in('status', ['confirmed', 'pending', 'completed']),
      
      // Pending appointments (requiring confirmation)
      supabase
        .from('Appointment')
        .select('id', { count: 'exact' })
        .eq('businessId', businessId)
        .eq('status', 'pending')
        .gte('startTime', formatDate(todayStart))
    ])
    
    return {
      // Basic stats
      services: services.count || 0,
      employees: employees.count || 0,
      appointments: appointments.count || 0,
      customers: customers.count || 0,
      
      // Enhanced stats
      todayAppointments: todayAppointments.count || 0,
      weekAppointments: weekAppointments.count || 0,
      monthAppointments: monthAppointments.count || 0,
      pendingAppointments: pendingAppointments.count || 0,
    }
  }

  static async completeOnboarding(data: CompleteOnboardingData) {
    const supabase = await this.getClient()
    
    console.log('BusinessService.completeOnboarding received data:', data)
    console.log('Service data:', data.service)
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Sie müssen angemeldet sein')
    }

    // Check if business already exists
    const { data: existingBusiness } = await supabase
      .from('Business')
      .select('id')
      .eq('email', data.business.email)
      .maybeSingle()

    if (existingBusiness) {
      throw new Error('Ein Unternehmen mit dieser E-Mail-Adresse existiert bereits')
    }

    // Transform business hours to the format expected by the database
    const transformedBusinessHours: any = {}
    Object.entries(data.business.businessHours).forEach(([day, hours]) => {
      if (hours.isOpen) {
        transformedBusinessHours[day] = {
          open: hours.openTime,
          close: hours.closeTime,
          ...(hours.hasLunchBreak && {
            lunchStart: hours.lunchStart,
            lunchEnd: hours.lunchEnd,
          }),
        }
      }
    })

    try {
      // 1. Create the business
      const businessData: BusinessInsert = {
        name: data.business.name,
        type: data.business.type,
        email: data.business.email,
        phone: data.business.phone,
        address: data.business.street,
        city: data.business.city,
        postalCode: data.business.postalCode,
        country: data.business.country || 'Schweiz',
        description: data.business.description || null,
        businessHours: transformedBusinessHours,
      }

      const { data: business, error: businessError } = await supabase
        .from('Business')
        .insert(businessData)
        .select()
        .single()

      if (businessError || !business) {
        console.error('Business creation error:', businessError)
        throw new Error(businessError?.message || 'Fehler beim Erstellen des Unternehmens')
      }

      const createdEmployees: Employee[] = []

      // 2. Create the owner/employee
      const ownerData = {
        businessId: business.id,
        email: data.owner.email,
        name: data.owner.name,
        phone: data.owner.phone || null,
        role: data.owner.role || 'Inhaber',
        isActive: true,
        canPerformServices: data.owner.canPerformServices ?? true,
        workingHours: data.owner.workingHours || transformedBusinessHours,
      }

      const { data: owner, error: ownerError } = await supabase
        .from('Employee')
        .insert(ownerData)
        .select()
        .single()

      if (ownerError || !owner) {
        // Rollback: delete the business
        await supabase.from('Business').delete().eq('id', business.id)
        throw new Error(ownerError?.message || 'Fehler beim Erstellen des Inhabers')
      }

      createdEmployees.push(owner)

      // 3. Optionally create additional employee
      if (data.additionalEmployee) {
        const employeeData = {
          businessId: business.id,
          email: data.additionalEmployee.email,
          name: data.additionalEmployee.name,
          phone: data.additionalEmployee.phone || null,
          role: data.additionalEmployee.role || 'Mitarbeiter',
          isActive: true,
          canPerformServices: data.additionalEmployee.canPerformServices ?? true,
          workingHours: data.additionalEmployee.workingHours || transformedBusinessHours,
        }

        const { data: employee, error: employeeError } = await supabase
          .from('Employee')
          .insert(employeeData)
          .select()
          .single()

        if (employeeError || !employee) {
          // Rollback: delete business and owner
          await supabase.from('Employee').delete().eq('id', owner.id)
          await supabase.from('Business').delete().eq('id', business.id)
          throw new Error(employeeError?.message || 'Fehler beim Erstellen des Mitarbeiters')
        }

        createdEmployees.push(employee)
      }

      // 4. Optionally create the first service
      let service: Service | null = null
      if (data.service) {
        console.log('Creating service with data:', {
          businessId: business.id,
          name: data.service.name,
          description: data.service.description || null,
          duration: data.service.duration,
          price: data.service.price,
          bufferBefore: data.service.bufferBefore || 0,
          bufferAfter: data.service.bufferAfter || 0,
        })
        
        const { data: serviceData, error: serviceError } = await supabase
          .from('Service')
          .insert({
            businessId: business.id,
            name: data.service.name,
            description: data.service.description || null,
            duration: data.service.duration,
            price: data.service.price,
            bufferBefore: data.service.bufferBefore || 0,
            bufferAfter: data.service.bufferAfter || 0,
            isActive: true,
          })
          .select()
          .single()

        if (serviceError || !serviceData) {
          console.error('Service creation failed:', serviceError)
          // Rollback: delete everything
          for (const emp of createdEmployees) {
            await supabase.from('Employee').delete().eq('id', emp.id)
          }
          await supabase.from('Business').delete().eq('id', business.id)
          throw new Error(serviceError?.message || 'Fehler beim Erstellen des Services')
        }

        console.log('Service created successfully:', serviceData)
        service = serviceData

        // 5. Assign service to employees who can perform services
        const employeesToAssign = createdEmployees.filter(emp => emp.canPerformServices)
        
        if (employeesToAssign.length > 0 && service) {
          const assignments = employeesToAssign.map(emp => ({
            employeeId: emp.id,
            serviceId: service!.id,
          }))

          const { error: assignError } = await supabase
            .from('EmployeeService')
            .insert(assignments)

          if (assignError) {
            console.error('Failed to assign service to employees:', assignError)
          }
        }
      }

      const returnValue = {
        success: true,
        business,
        employees: createdEmployees,
        service,
      }
      
      console.log('Returning from completeOnboarding:', returnValue)
      return returnValue
    } catch (error: any) {
      console.error('Onboarding error:', error)
      throw error
    }
  }
}