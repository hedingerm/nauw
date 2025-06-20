'use client'

import { useState } from 'react'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { SwitchEnhanced as Switch } from '@/src/components/ui/switch-enhanced'
import { Textarea } from '@/src/components/ui/textarea'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { BookingPageConfigService } from '@/src/lib/services/booking-config.service'
import { toast } from 'sonner'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'
import { themePresets } from '@/src/lib/types/booking-config'

interface DesignTabProps {
  config: BookingPageConfig
  onUpdate: (updates: Partial<BookingPageConfig>) => void
  businessId: string
}

export function DesignTab({ config, onUpdate, businessId }: DesignTabProps) {
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const handleColorChange = (field: keyof typeof config.theme, value: string) => {
    onUpdate({
      theme: {
        ...config.theme,
        [field]: value,
      },
    })
  }

  const handleThemePreset = (presetKey: keyof typeof themePresets) => {
    const preset = themePresets[presetKey]
    onUpdate({
      theme: preset.theme,
    })
  }

  const handleImageUpload = async (file: File, type: 'logo' | 'cover') => {
    try {
      if (type === 'logo') setUploadingLogo(true)
      else setUploadingCover(true)

      const url = await BookingPageConfigService.uploadImage(businessId, file, type)
      
      // Always update the local state with the URL, even if the database update failed
      const updateField = type === 'logo' ? 'logoUrl' : 'coverImageUrl'
      onUpdate({ [updateField]: url })
      
      toast.success(`${type === 'logo' ? 'Logo' : 'Header-Bild'} erfolgreich hochgeladen`)
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Fehler beim Hochladen des Bildes')
    } finally {
      if (type === 'logo') setUploadingLogo(false)
      else setUploadingCover(false)
    }
  }

  const handleImageRemove = async (type: 'logo' | 'cover') => {
    try {
      await BookingPageConfigService.removeImage(businessId, type)
      
      const updateField = type === 'logo' ? 'logoUrl' : 'coverImageUrl'
      onUpdate({ [updateField]: null })
      
      toast.success(`${type === 'logo' ? 'Logo' : 'Header-Bild'} entfernt`)
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error('Fehler beim Entfernen des Bildes')
    }
  }

  return (
    <div className="space-y-6">
      {/* Theme Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Vorgefertigte Designs</CardTitle>
          <CardDescription>
            Wählen Sie ein Design als Ausgangspunkt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(themePresets).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => handleThemePreset(key as keyof typeof themePresets)}
              >
                <div className="w-full h-20 rounded flex items-center justify-center gap-2" style={{
                  backgroundColor: preset.theme.primaryColor,
                }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.theme.secondaryColor }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.theme.accentColor }} />
                </div>
                <span className="text-sm">{preset.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logo & Images */}
      <Card>
        <CardHeader>
          <CardTitle>Logo & Bilder</CardTitle>
          <CardDescription>
            Laden Sie Ihr Logo und Header-Bild hoch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Upload */}
          <div>
            <Label>Logo</Label>
            {config.logoUrl ? (
              <div className="mt-2 relative inline-block">
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="h-20 object-contain rounded border"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => handleImageRemove('logo')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="mt-2">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {uploadingLogo ? 'Wird hochgeladen...' : 'Klicken Sie hier, um ein Logo hochzuladen'}
                    </p>
                  </div>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'logo')
                  }}
                  disabled={uploadingLogo}
                />
              </div>
            )}
          </div>

          {/* Cover Image Upload */}
          <div>
            <Label>Header-Bild</Label>
            {config.coverImageUrl ? (
              <div className="mt-2 relative inline-block">
                <img
                  src={config.coverImageUrl}
                  alt="Header"
                  className="h-32 w-full object-cover rounded border"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => handleImageRemove('cover')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="mt-2">
                <Label htmlFor="cover-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {uploadingCover ? 'Wird hochgeladen...' : 'Klicken Sie hier, um ein Header-Bild hochzuladen'}
                    </p>
                  </div>
                </Label>
                <Input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'cover')
                  }}
                  disabled={uploadingCover}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Farben</CardTitle>
          <CardDescription>
            Passen Sie die Farbpalette Ihrer Buchungsseite an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={config.theme.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={config.theme.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  placeholder="#2563eb"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Sekundärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={config.theme.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={config.theme.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  placeholder="#64748b"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Akzentfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={config.theme.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={config.theme.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  placeholder="#f59e0b"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Hintergrundfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={config.theme.backgroundColor}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={config.theme.backgroundColor}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textColor">Textfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={config.theme.textColor}
                  onChange={(e) => handleColorChange('textColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={config.theme.textColor}
                  onChange={(e) => handleColorChange('textColor', e.target.value)}
                  placeholder="#1f2937"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typografie</CardTitle>
          <CardDescription>
            Wählen Sie Schriftart und Stil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fontFamily">Schriftart</Label>
            <Select
              value={config.theme.fontFamily}
              onValueChange={(value) => handleColorChange('fontFamily', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter (Modern)</SelectItem>
                <SelectItem value="Arial">Arial (Klassisch)</SelectItem>
                <SelectItem value="Georgia">Georgia (Elegant)</SelectItem>
                <SelectItem value="Playfair Display">Playfair Display (Stilvoll)</SelectItem>
                <SelectItem value="Roboto">Roboto (Sauber)</SelectItem>
                <SelectItem value="Open Sans">Open Sans (Freundlich)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="borderRadius">Eckenradius</Label>
            <Select
              value={config.theme.borderRadius}
              onValueChange={(value) => onUpdate({
                theme: {
                  ...config.theme,
                  borderRadius: value as any,
                },
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine (Eckig)</SelectItem>
                <SelectItem value="small">Klein</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="large">Groß</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}