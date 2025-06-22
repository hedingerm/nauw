import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/lib/supabase/database.types'
import { 
  createCustomerSchema, 
  updateCustomerSchema,
  searchCustomersSchema,
  filterCustomersSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type SearchCustomersInput,
  type FilterCustomersInput,
  type CustomerWithRelations,
  type CustomerLookupResult
} from '@/src/lib/schemas/customer'
import { z } from 'zod'
import { normalizeEmail, normalizePhone } from '@/src/lib/utils/normalize'

type Customer = Database['public']['Tables']['Customer']['Row']
type CustomerInsert = Database['public']['Tables']['Customer']['Insert']
type CustomerUpdate = Database['public']['Tables']['Customer']['Update']

export class CustomerService {
  private static async getClient() {
    return createClient()
  }

  static async findByEmail(email: string | null | undefined, businessId: string): Promise<Customer | null> {
    if (!email) return null
    
    const supabase = await this.getClient()
    
    const normalizedEmail = normalizeEmail(email)
    
    const { data } = await supabase
      .from('Customer')
      .select('*')
      .eq('businessId', businessId)
      .ilike('email', normalizedEmail)
      .single()
    
    return data || null
  }

  static async findByPhone(phone: string, businessId: string): Promise<Customer | null> {
    const supabase = await this.getClient()
    
    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return null
    
    // We need to search for customers whose normalized phone matches
    const { data: customers } = await supabase
      .from('Customer')
      .select('*')
      .eq('businessId', businessId)
      .not('phone', 'is', null)
    
    // Filter in memory since we can't normalize in SQL easily
    const found = customers?.find(c => 
      normalizePhone(c.phone) === normalizedPhone
    )
    
    return found || null
  }

  static async createSimple(data: {
    businessId: string
    firstName: string
    lastName: string
    email?: string
    phone: string
  }): Promise<Customer> {
    const supabase = await this.getClient()
    
    const name = `${data.firstName} ${data.lastName}`
    const normalizedEmail = data.email ? normalizeEmail(data.email) : null
    const normalizedPhone = normalizePhone(data.phone)
    
    const { data: customer, error } = await supabase
      .from('Customer')
      .insert({
        businessId: data.businessId,
        name,
        email: normalizedEmail,
        phone: normalizedPhone,
        isActive: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      console.error('Customer data:', { businessId: data.businessId, name, email: normalizedEmail, phone: normalizedPhone })
      throw new Error(error.message || 'Fehler beim Erstellen des Kunden')
    }

    return customer
  }

  static async create(businessId: string, data: CreateCustomerInput): Promise<Customer> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedData = createCustomerSchema.parse(data)
    
    // Normalize email and phone
    const normalizedEmail = validatedData.email ? normalizeEmail(validatedData.email) : null
    const normalizedPhone = normalizePhone(validatedData.phone)
    
    // Check if customer with same email already exists for this business (only if email provided)
    if (normalizedEmail) {
      const existingByEmail = await this.findByEmail(normalizedEmail, businessId)
      if (existingByEmail) {
        throw new Error('Ein Kunde mit dieser E-Mail-Adresse existiert bereits')
      }
    }
    
    // Check if customer with same phone exists (if phone provided)
    if (normalizedPhone) {
      const existingByPhone = await this.findByPhone(normalizedPhone, businessId)
      if (existingByPhone) {
        throw new Error('Ein Kunde mit dieser Telefonnummer existiert bereits')
      }
    }
    
    const { data: customer, error } = await supabase
      .from('Customer')
      .insert({
        businessId,
        ...validatedData,
        email: normalizedEmail,
        phone: normalizedPhone,
        isActive: true,  // Explicitly set isActive to true for new customers
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      console.error('Customer insert data:', {
        businessId,
        ...validatedData,
        email: normalizedEmail,
        phone: normalizedPhone,
        isActive: true,
      })
      throw new Error(error.message || 'Fehler beim Erstellen des Kunden')
    }

    return customer
  }

  static async getById(id: string): Promise<Customer> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Customer')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching customer:', error)
      throw new Error('Fehler beim Abrufen des Kunden')
    }

    if (!data) {
      throw new Error('Kunde nicht gefunden')
    }

    return data
  }

  static async update(id: string, data: UpdateCustomerInput): Promise<Customer> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedData = updateCustomerSchema.parse(data)
    
    // Normalize email and phone if provided
    const updateData: any = { ...validatedData }
    if (validatedData.email) {
      updateData.email = normalizeEmail(validatedData.email)
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = normalizePhone(validatedData.phone)
    }
    
    const { data: customer, error } = await supabase
      .from('Customer')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      throw new Error('Fehler beim Aktualisieren des Kunden')
    }

    return customer
  }

  static async delete(id: string): Promise<void> {
    const supabase = await this.getClient()
    
    // Check if customer has appointments
    const { data: appointments } = await supabase
      .from('Appointment')
      .select('id')
      .eq('customerId', id)
      .limit(1)

    if (appointments && appointments.length > 0) {
      throw new Error('Kunde kann nicht gelöscht werden, da noch Termine vorhanden sind')
    }

    const { error } = await supabase
      .from('Customer')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting customer:', error)
      throw new Error('Fehler beim Löschen des Kunden')
    }
  }

  static async list(input: FilterCustomersInput): Promise<{
    customers: CustomerWithRelations[]
    total: number
    page: number
    totalPages: number
  }> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedInput = filterCustomersSchema.parse(input)
    const { businessId, isActive, vipStatus, sortBy, sortOrder, page, limit } = validatedInput
    
    let query = supabase
      .from('Customer')
      .select(`
        *,
        appointments:Appointment(
          id,
          startTime,
          status,
          service:Service(price)
        )
      `, { count: 'exact' })
      .eq('businessId', businessId)
    
    if (isActive !== undefined) {
      query = query.eq('isActive', isActive)
    }
    
    if (vipStatus !== undefined) {
      query = query.eq('vipStatus', vipStatus)
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'name':
        query = query.order('name', { ascending: sortOrder === 'asc' })
        break
      case 'createdAt':
        query = query.order('createdAt', { ascending: sortOrder === 'asc' })
        break
      // Note: lastAppointment sorting would require a more complex query
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query

    if (error) {
      console.error('Error listing customers:', error)
      throw new Error('Fehler beim Abrufen der Kundenliste')
    }

    // Transform data to include appointment count, last visit, and total spent
    const customers: CustomerWithRelations[] = (data || []).map(customer => {
      const appointments = customer.appointments || []
      const lastAppointment = appointments
        .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
      
      // Calculate total spent from completed appointments
      const totalSpent = appointments
        .filter((a: any) => a.status === 'completed')
        .reduce((sum: number, a: any) => sum + (a.service?.price || 0), 0)
      
      return {
        ...customer,
        appointmentCount: appointments.length,
        lastAppointmentDate: lastAppointment?.startTime || null,
        totalSpent,
        appointments: undefined, // Remove raw appointments from response
      }
    })

    return {
      customers,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    }
  }

  static async search(input: SearchCustomersInput): Promise<CustomerLookupResult[]> {
    const supabase = await this.getClient()
    
    // Validate input
    const { query, businessId, limit } = searchCustomersSchema.parse(input)
    
    // Search by name, email, or phone
    const { data, error } = await supabase
      .from('Customer')
      .select(`
        id,
        name,
        email,
        phone,
        appointments:Appointment(id, startTime)
      `)
      .eq('businessId', businessId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      console.error('Error searching customers:', error)
      throw new Error('Fehler bei der Kundensuche')
    }

    // Transform results for lookup
    return (data || []).map(customer => {
      const appointments = customer.appointments || []
      const lastAppointment = appointments
        .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
      
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        lastVisit: lastAppointment?.startTime || null,
        visitCount: appointments.length,
      }
    })
  }

  static async getOrCreate(businessId: string, data: Partial<CreateCustomerInput> & { name: string }): Promise<Customer> {
    const supabase = await this.getClient()
    
    // Normalize email and phone for searching
    const normalizedEmail = data.email ? normalizeEmail(data.email) : null
    const normalizedPhone = normalizePhone(data.phone)
    
    // First try to find existing customer by email (if provided)
    let existingCustomer: Customer | null = null
    if (normalizedEmail) {
      existingCustomer = await this.findByEmail(normalizedEmail, businessId)
    }
    
    // If not found by email but phone is provided, try to find by phone
    if (!existingCustomer && normalizedPhone) {
      existingCustomer = await this.findByPhone(normalizedPhone, businessId)
      
      // If found by phone, update the email if different
      if (existingCustomer) {
        const updates: UpdateCustomerInput = {}
        if (existingCustomer.email && normalizedEmail && normalizeEmail(existingCustomer.email) !== normalizedEmail) {
          updates.email = normalizedEmail || undefined
        }
        if (data.name !== existingCustomer.name) {
          updates.name = data.name
        }
        
        if (Object.keys(updates).length > 0) {
          return this.update(existingCustomer.id, updates)
        }
      }
    }
    
    if (existingCustomer) {
      // Update existing customer with new data if provided
      const updates: UpdateCustomerInput = {}
      
      if (data.name !== existingCustomer.name) {
        updates.name = data.name
      }
      
      if (normalizedPhone && normalizePhone(existingCustomer.phone) !== normalizedPhone) {
        updates.phone = normalizedPhone
      }
      
      if (Object.keys(updates).length > 0) {
        return this.update(existingCustomer.id, updates)
      }
      
      return existingCustomer
    }
    
    // Create new customer with defaults for missing fields
    // For getOrCreate, if phone is not provided, we cannot create a new customer
    if (!data.phone) {
      throw new Error('Telefonnummer ist erforderlich für neue Kunden')
    }
    
    const customerData: CreateCustomerInput = {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone,
      notes: data.notes || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      postalCode: data.postalCode || undefined,
      birthday: data.birthday || undefined,
      gender: data.gender || undefined,
      preferredContactMethod: data.preferredContactMethod || 'email',
      marketingConsent: data.marketingConsent || false,
      source: data.source || undefined,
      tags: data.tags || undefined,
      vipStatus: data.vipStatus || false,
    }
    
    return this.create(businessId, customerData)
  }

  static async toggleActive(id: string): Promise<Customer> {
    const supabase = await this.getClient()
    
    const { data: customer } = await supabase
      .from('Customer')
      .select('isActive')
      .eq('id', id)
      .single()

    if (!customer) {
      throw new Error('Kunde nicht gefunden')
    }

    const { data: updatedCustomer, error } = await supabase
      .from('Customer')
      .update({ isActive: !customer.isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling customer status:', error)
      throw new Error('Fehler beim Ändern des Kundenstatus')
    }

    return updatedCustomer
  }

  static async getAppointmentHistory(customerId: string) {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Appointment')
      .select(`
        *,
        service:Service(name, price),
        employee:Employee(name)
      `)
      .eq('customerId', customerId)
      .order('startTime', { ascending: false })

    if (error) {
      console.error('Error fetching appointment history:', error)
      throw new Error('Fehler beim Abrufen der Terminhistorie')
    }

    return { data }
  }
}