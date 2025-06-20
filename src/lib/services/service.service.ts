import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/lib/supabase/database.types'
import { createServiceSchema, updateServiceSchema } from '@/src/lib/schemas/service'
import { z } from 'zod'

type Service = Database['public']['Tables']['Service']['Row']
type ServiceInsert = Database['public']['Tables']['Service']['Insert']
type ServiceUpdate = Database['public']['Tables']['Service']['Update']
type ServiceCategory = Database['public']['Tables']['ServiceCategory']['Row']

export interface ServiceWithCategory extends Service {
  category?: ServiceCategory | null
}

export interface ServicesGroupedByCategory {
  category: ServiceCategory | null
  services: Service[]
}

export class ServiceService {
  private static async getClient() {
    return createClient()
  }

  static async list(businessId: string): Promise<Service[]> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Service')
      .select('*')
      .eq('businessId', businessId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching services:', error)
      throw new Error(error.message)
    }

    return data || []
  }

  static async listActive(businessId: string): Promise<Service[]> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Service')
      .select('*')
      .eq('businessId', businessId)
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching active services:', error)
      throw new Error(error.message)
    }

    return data || []
  }

  static async listWithCategories(businessId: string): Promise<ServiceWithCategory[]> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Service')
      .select(`
        *,
        category:ServiceCategory(*)
      `)
      .eq('businessId', businessId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching services with categories:', error)
      throw new Error(error.message)
    }

    return data || []
  }

  static async listGroupedByCategory(businessId: string): Promise<ServicesGroupedByCategory[]> {
    const supabase = await this.getClient()
    
    // Get all services with their categories
    const { data: services, error: servicesError } = await supabase
      .from('Service')
      .select(`
        *,
        category:ServiceCategory(*)
      `)
      .eq('businessId', businessId)
      .order('name', { ascending: true })

    if (servicesError) {
      console.error('Error fetching services:', servicesError)
      throw new Error(servicesError.message)
    }

    // Get all categories to ensure we show empty categories too
    const { data: categories, error: categoriesError } = await supabase
      .from('ServiceCategory')
      .select('*')
      .eq('businessId', businessId)
      .order('displayOrder', { ascending: true })
      .order('name', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      throw new Error(categoriesError.message)
    }

    // Group services by category
    const grouped: Map<string | null, ServicesGroupedByCategory> = new Map()
    
    // Initialize with all categories
    categories?.forEach(category => {
      grouped.set(category.id, {
        category,
        services: []
      })
    })
    
    // Add uncategorized group
    grouped.set(null, {
      category: null,
      services: []
    })

    // Assign services to their categories
    services?.forEach(service => {
      const categoryId = service.categoryId
      const group = grouped.get(categoryId)
      if (group) {
        group.services.push(service)
      }
    })

    // Convert to array and filter out empty categories (except uncategorized)
    return Array.from(grouped.values()).filter(
      group => group.services.length > 0 || group.category === null
    )
  }

  static async listActiveGroupedByCategory(businessId: string): Promise<ServicesGroupedByCategory[]> {
    const supabase = await this.getClient()
    
    // Get only active services with their categories
    const { data: services, error: servicesError } = await supabase
      .from('Service')
      .select(`
        *,
        category:ServiceCategory(*)
      `)
      .eq('businessId', businessId)
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (servicesError) {
      console.error('Error fetching active services:', servicesError)
      throw new Error(servicesError.message)
    }

    // Get all categories to maintain proper ordering
    const { data: categories, error: categoriesError } = await supabase
      .from('ServiceCategory')
      .select('*')
      .eq('businessId', businessId)
      .order('displayOrder', { ascending: true })
      .order('name', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      throw new Error(categoriesError.message)
    }

    // Group services by category
    const grouped: Map<string | null, ServicesGroupedByCategory> = new Map()
    
    // Initialize with categories that will have services
    const categoriesWithServices = new Set<string>()
    services?.forEach(service => {
      if (service.categoryId) {
        categoriesWithServices.add(service.categoryId)
      }
    })

    // Add only categories that have active services
    categories?.forEach(category => {
      if (categoriesWithServices.has(category.id)) {
        grouped.set(category.id, {
          category,
          services: []
        })
      }
    })
    
    // Add uncategorized group only if there are uncategorized services
    const hasUncategorized = services?.some(service => !service.categoryId)
    if (hasUncategorized) {
      grouped.set(null, {
        category: null,
        services: []
      })
    }

    // Assign services to their categories
    services?.forEach(service => {
      const categoryId = service.categoryId
      const group = grouped.get(categoryId)
      if (group) {
        group.services.push(service)
      }
    })

    // Convert to array - already filtered to only include categories with services
    return Array.from(grouped.values())
  }

  static async getById(id: string): Promise<Service> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('Service')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching service:', error)
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('Service nicht gefunden')
    }

    return data
  }

  static async create(businessId: string, data: z.infer<typeof createServiceSchema>): Promise<Service> {
    const supabase = await this.getClient()
    
    const { data: service, error } = await supabase
      .from('Service')
      .insert({
        ...data,
        businessId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      throw new Error(error.message)
    }

    return service
  }

  static async update(id: string, data: z.infer<typeof updateServiceSchema>): Promise<Service> {
    const supabase = await this.getClient()
    
    const { data: service, error } = await supabase
      .from('Service')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      throw new Error(error.message)
    }

    return service
  }

  static async delete(id: string): Promise<void> {
    const supabase = await this.getClient()
    
    // Check if service has appointments
    const { data: appointments } = await supabase
      .from('Appointment')
      .select('id')
      .eq('serviceId', id)
      .in('status', ['confirmed', 'pending'])
      .limit(1)

    if (appointments && appointments.length > 0) {
      throw new Error('Service kann nicht gelöscht werden, da noch Termine vorhanden sind')
    }

    const { error } = await supabase
      .from('Service')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting service:', error)
      throw new Error(error.message)
    }
  }

  static async toggleActive(id: string): Promise<Service> {
    const supabase = await this.getClient()
    
    const { data: service } = await supabase
      .from('Service')
      .select('isActive')
      .eq('id', id)
      .single()

    if (!service) {
      throw new Error('Service nicht gefunden')
    }

    const { data: updatedService, error } = await supabase
      .from('Service')
      .update({ isActive: !service.isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling service:', error)
      throw new Error(error.message)
    }

    return updatedService
  }
}