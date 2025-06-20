import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/lib/supabase/database.types'
import { 
  createServiceCategorySchema, 
  updateServiceCategorySchema,
  type CreateServiceCategoryInput,
  type UpdateServiceCategoryInput
} from '@/src/lib/schemas/service-category'
import { z } from 'zod'

type ServiceCategory = Database['public']['Tables']['ServiceCategory']['Row']
type ServiceCategoryInsert = Database['public']['Tables']['ServiceCategory']['Insert']
type ServiceCategoryUpdate = Database['public']['Tables']['ServiceCategory']['Update']

export interface ServiceCategoryWithCount extends ServiceCategory {
  serviceCount?: number
}

export class ServiceCategoryService {
  private static async getClient() {
    return createClient()
  }

  static async list(businessId: string): Promise<ServiceCategoryWithCount[]> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('ServiceCategory')
      .select(`
        *,
        Service(count)
      `)
      .eq('businessId', businessId)
      .order('displayOrder', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching service categories:', error)
      throw new Error('Fehler beim Abrufen der Servicekategorien')
    }

    // Transform the data to include service count
    return (data || []).map(category => ({
      ...category,
      serviceCount: category.Service?.[0]?.count || 0
    }))
  }

  static async getById(id: string): Promise<ServiceCategory> {
    const supabase = await this.getClient()
    
    const { data, error } = await supabase
      .from('ServiceCategory')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching service category:', error)
      throw new Error('Servicekategorie nicht gefunden')
    }

    return data
  }

  static async create(businessId: string, input: CreateServiceCategoryInput): Promise<ServiceCategory> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedData = createServiceCategorySchema.parse(input)
    
    // Check if category name already exists for this business
    const { data: existing } = await supabase
      .from('ServiceCategory')
      .select('id')
      .eq('businessId', businessId)
      .eq('name', validatedData.name)
      .single()

    if (existing) {
      throw new Error('Eine Kategorie mit diesem Namen existiert bereits')
    }

    // Create category
    const { data, error } = await supabase
      .from('ServiceCategory')
      .insert({
        ...validatedData,
        businessId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service category:', error)
      throw new Error('Fehler beim Erstellen der Servicekategorie')
    }

    return data
  }

  static async update(id: string, input: UpdateServiceCategoryInput): Promise<ServiceCategory> {
    const supabase = await this.getClient()
    
    // Validate input
    const validatedData = updateServiceCategorySchema.parse(input)
    
    // If updating name, check if it already exists
    if (validatedData.name) {
      const { data: category } = await supabase
        .from('ServiceCategory')
        .select('businessId')
        .eq('id', id)
        .single()

      if (category) {
        const { data: existing } = await supabase
          .from('ServiceCategory')
          .select('id')
          .eq('businessId', category.businessId)
          .eq('name', validatedData.name)
          .neq('id', id)
          .single()

        if (existing) {
          throw new Error('Eine Kategorie mit diesem Namen existiert bereits')
        }
      }
    }

    // Update category
    const { data, error } = await supabase
      .from('ServiceCategory')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service category:', error)
      throw new Error('Fehler beim Aktualisieren der Servicekategorie')
    }

    return data
  }

  static async delete(id: string): Promise<void> {
    const supabase = await this.getClient()
    
    // Services will automatically have their categoryId set to null due to ON DELETE SET NULL
    const { error } = await supabase
      .from('ServiceCategory')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting service category:', error)
      throw new Error('Fehler beim Löschen der Servicekategorie')
    }
  }

  static async updateOrder(businessId: string, categoryOrders: { id: string; displayOrder: number }[]): Promise<void> {
    const supabase = await this.getClient()
    
    // Update each category's display order
    const updates = categoryOrders.map(({ id, displayOrder }) => 
      supabase
        .from('ServiceCategory')
        .update({ displayOrder })
        .eq('id', id)
        .eq('businessId', businessId)
    )

    const results = await Promise.all(updates)
    
    const hasError = results.some(result => result.error)
    if (hasError) {
      throw new Error('Fehler beim Aktualisieren der Reihenfolge')
    }
  }
}