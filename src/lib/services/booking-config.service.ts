import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/lib/supabase/database.types'
import type { 
  BookingPageConfig, 
  BookingPageTheme, 
  BookingPageLayout, 
  BookingPageContent, 
  BookingPageFeatures,
  BookingPageSEO
} from '@/src/lib/types/booking-config'
import {
  defaultTheme,
  defaultLayout,
  defaultContent,
  defaultFeatures,
  defaultSEO
} from '@/src/lib/types/booking-config'

type BookingPageConfigRow = Database['public']['Tables']['BookingPageConfig']['Row']
type BookingPageConfigInsert = Database['public']['Tables']['BookingPageConfig']['Insert']
type BookingPageConfigUpdate = Database['public']['Tables']['BookingPageConfig']['Update']

export class BookingPageConfigService {
  private static getClient() {
    return createClient()
  }

  static async getByBusinessId(businessId: string): Promise<BookingPageConfig | null> {
    const supabase = this.getClient()
    
    const { data, error } = await supabase
      .from('BookingPageConfig')
      .select('*')
      .eq('businessId', businessId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No config found, return null
        return null
      }
      console.error('Error fetching booking config:', error)
      throw new Error('Fehler beim Abrufen der Buchungskonfiguration')
    }

    return this.transformRowToConfig(data)
  }

  static async create(businessId: string): Promise<BookingPageConfig> {
    const supabase = this.getClient()
    
    const insertData: BookingPageConfigInsert = {
      businessId,
      // The database defaults will handle the JSON fields
    }

    const { data, error } = await supabase
      .from('BookingPageConfig')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating booking config:', error)
      throw new Error('Fehler beim Erstellen der Buchungskonfiguration')
    }

    return this.transformRowToConfig(data)
  }

  static async update(
    businessId: string, 
    updates: Partial<{
      theme: Partial<BookingPageTheme>
      layout: Partial<BookingPageLayout>
      content: Partial<BookingPageContent>
      features: Partial<BookingPageFeatures>
      seo: Partial<BookingPageSEO>
      customCSS: string
      logoUrl: string | null
      coverImageUrl: string | null
      faviconUrl: string | null
    }>
  ): Promise<BookingPageConfig> {
    const supabase = this.getClient()
    
    // Get current config to merge updates
    const currentConfig = await this.getByBusinessId(businessId)
    if (!currentConfig) {
      // Create new config if it doesn't exist
      await this.create(businessId)
      return this.update(businessId, updates)
    }

    const updateData: BookingPageConfigUpdate = {}

    // Merge theme updates
    if (updates.theme) {
      updateData.theme = {
        ...currentConfig.theme,
        ...updates.theme,
      }
    }

    // Merge layout updates
    if (updates.layout) {
      updateData.layout = {
        ...currentConfig.layout,
        ...updates.layout,
      }
    }

    // Merge content updates
    if (updates.content) {
      updateData.content = {
        ...currentConfig.content,
        ...updates.content,
        // Merge socialLinks separately to preserve existing links
        socialLinks: updates.content.socialLinks ? {
          ...currentConfig.content.socialLinks,
          ...updates.content.socialLinks,
        } : currentConfig.content.socialLinks,
      }
    }

    // Merge features updates
    if (updates.features) {
      updateData.features = {
        ...currentConfig.features,
        ...updates.features,
      }
    }

    // Merge SEO updates
    if (updates.seo) {
      updateData.seo = {
        ...currentConfig.seo,
        ...updates.seo,
      }
    }
    
    // Ensure we have at least one field to update
    if (Object.keys(updateData).length === 0) {
      console.warn('No fields to update in BookingPageConfig')
      return currentConfig
    }

    // Direct updates
    if (updates.customCSS !== undefined) updateData.customCSS = updates.customCSS
    if (updates.logoUrl !== undefined) updateData.logoUrl = updates.logoUrl
    if (updates.coverImageUrl !== undefined) updateData.coverImageUrl = updates.coverImageUrl
    if (updates.faviconUrl !== undefined) updateData.faviconUrl = updates.faviconUrl

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('BookingPageConfig')
      .update(updateData)
      .eq('businessId', businessId)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking config:', {
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        updateData,
        businessId,
        fullError: JSON.stringify(error)
      })
      throw new Error(`Fehler beim Aktualisieren der Buchungskonfiguration: ${error.message || error.code || 'Unbekannter Fehler'}`)
    }
    
    if (!data) {
      throw new Error('Keine Daten nach Update erhalten')
    }

    return this.transformRowToConfig(data)
  }

  static async getOrCreate(businessId: string): Promise<BookingPageConfig> {
    const existing = await this.getByBusinessId(businessId)
    if (existing) return existing
    
    return this.create(businessId)
  }

  static async uploadImage(
    businessId: string,
    file: File,
    type: 'logo' | 'cover' | 'favicon'
  ): Promise<string> {
    const supabase = this.getClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Nicht angemeldet. Bitte melden Sie sich erneut an.')
    }
    
    // Check file size (max 5MB as configured in bucket)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Datei ist zu groß. Maximale Größe: 5MB')
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Ungültiger Dateityp. Erlaubt sind: JPG, PNG, GIF, SVG, WebP')
    }
    
    // Create unique filename with proper path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${businessId}/${type}-${Date.now()}.${fileExt}`
    
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('booking-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('Storage upload error details:', {
        error,
        fileName,
        bucketName: 'booking-images',
        authenticated: !!session
      })
      
      // Check for specific error types
      if (error.message?.includes('row level security') || error.message?.includes('policy')) {
        throw new Error('Keine Berechtigung zum Hochladen. Bitte melden Sie sich erneut an.')
      } else if (error.message?.includes('Invalid file type')) {
        throw new Error('Ungültiger Dateityp. Erlaubt sind: JPG, PNG, GIF, SVG, WebP')
      } else if (error.message?.includes('The resource already exists')) {
        // Try with a different filename
        const altFileName = `${businessId}/${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const { data: retryData, error: retryError } = await supabase.storage
          .from('booking-images')
          .upload(altFileName, file, {
            cacheControl: '3600',
            upsert: true,
          })
        
        if (retryError) {
          throw new Error(`Fehler beim Hochladen: ${retryError.message}`)
        }
        
        // Get public URL for retry
        const { data: { publicUrl } } = supabase.storage
          .from('booking-images')
          .getPublicUrl(altFileName)

        // Update config with new URL using a direct database update
        const updateField = type === 'logo' ? 'logoUrl' : type === 'cover' ? 'coverImageUrl' : 'faviconUrl'
        
        try {
          // Direct update to avoid complex merge logic
          const { error: updateError } = await supabase
            .from('BookingPageConfig')
            .update({ 
              [updateField]: publicUrl,
              updatedAt: new Date().toISOString()
            })
            .eq('businessId', businessId)
          
          if (updateError) {
            console.error('Direct update error (retry):', updateError)
            // Still return the URL since upload was successful
          }
        } catch (updateError) {
          console.error('Failed to update config with image URL, but image was uploaded successfully:', publicUrl)
          // Return the URL anyway since the upload was successful
        }

        return publicUrl
      }
      
      throw new Error(`Fehler beim Hochladen: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('booking-images')
      .getPublicUrl(fileName)


    // Update config with new URL using a direct database update
    const updateField = type === 'logo' ? 'logoUrl' : type === 'cover' ? 'coverImageUrl' : 'faviconUrl'
    
    try {
      // Direct update to avoid complex merge logic
      const { error: updateError } = await supabase
        .from('BookingPageConfig')
        .update({ 
          [updateField]: publicUrl,
          updatedAt: new Date().toISOString()
        })
        .eq('businessId', businessId)
      
      if (updateError) {
        console.error('Direct update error:', updateError)
        // Still return the URL since upload was successful
      }
    } catch (updateError) {
      console.error('Failed to update config with image URL, but image was uploaded successfully:', publicUrl)
      // Return the URL anyway since the upload was successful
    }

    return publicUrl
  }

  static async removeImage(
    businessId: string,
    type: 'logo' | 'cover' | 'favicon'
  ): Promise<void> {
    const supabase = this.getClient()
    
    // Get current config to find the image URL
    const config = await this.getByBusinessId(businessId)
    if (!config) {
      throw new Error('Konfiguration nicht gefunden')
    }
    
    const updateField = type === 'logo' ? 'logoUrl' : type === 'cover' ? 'coverImageUrl' : 'faviconUrl'
    const currentUrl = config[updateField]
    
    // If there's an image URL, try to delete it from storage
    if (currentUrl && currentUrl.includes('supabase.co/storage')) {
      try {
        // Extract the file path from the URL
        const urlParts = currentUrl.split('/storage/v1/object/public/booking-images/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          
          const { error: deleteError } = await supabase.storage
            .from('booking-images')
            .remove([filePath])
          
          if (deleteError) {
            console.error('Error deleting file from storage:', deleteError)
            // Continue anyway to remove the URL from database
          }
        }
      } catch (error) {
        console.error('Error processing storage deletion:', error)
        // Continue anyway to remove the URL from database
      }
    }
    
    // Update database to remove the URL
    try {
      const { error: updateError } = await supabase
        .from('BookingPageConfig')
        .update({ 
          [updateField]: null,
          updatedAt: new Date().toISOString()
        })
        .eq('businessId', businessId)
      
      if (updateError) {
        console.error('Error updating config:', updateError)
        throw new Error('Fehler beim Entfernen des Bildes')
      }
    } catch (error) {
      throw new Error('Fehler beim Aktualisieren der Konfiguration')
    }
  }

  private static transformRowToConfig(row: BookingPageConfigRow): BookingPageConfig {
    return {
      id: row.id,
      businessId: row.businessId,
      theme: (row.theme as unknown as BookingPageTheme) || {},
      layout: (row.layout as unknown as BookingPageLayout) || {},
      content: (row.content as unknown as BookingPageContent) || {},
      features: (row.features as unknown as BookingPageFeatures) || {},
      seo: (row.seo as unknown as BookingPageSEO) || {},
      customCSS: row.customCSS || '',
      logoUrl: row.logoUrl,
      coverImageUrl: row.coverImageUrl,
      faviconUrl: row.faviconUrl,
      createdAt: row.createdAt || new Date().toISOString(),
      updatedAt: row.updatedAt || new Date().toISOString(),
    }
  }

  // Helper method to get CSS variables from theme
  static getThemeCSSVariables(theme: BookingPageTheme): string {
    return `
      :root {
        --primary: ${theme.primaryColor};
        --secondary: ${theme.secondaryColor};
        --accent: ${theme.accentColor};
        --background: ${theme.backgroundColor};
        --text: ${theme.textColor};
        --radius: ${
          theme.borderRadius === 'none' ? '0' :
          theme.borderRadius === 'small' ? '0.25rem' :
          theme.borderRadius === 'medium' ? '0.5rem' :
          '1rem'
        };
      }
      
      body {
        font-family: ${theme.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background-color: var(--background);
        color: var(--text);
      }
      
      ${theme.darkMode ? `
        @media (prefers-color-scheme: dark) {
          :root {
            --background: #0f172a;
            --text: #f8fafc;
          }
        }
      ` : ''}
    `
  }
}