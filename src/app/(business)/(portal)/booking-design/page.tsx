'use client'

import { useState, useEffect } from 'react'
import { BusinessService } from '@/src/lib/services/business.service'
import { BookingPageConfigService } from '@/src/lib/services/booking-config.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/src/lib/utils/cn'
import { 
  Palette, 
  Layout, 
  FileText, 
  Settings2, 
  Save,
  ExternalLink
} from 'lucide-react'
import { DesignTab } from '@/src/components/booking-design/design-tab'
import { LayoutTab } from '@/src/components/booking-design/layout-tab'
import { ContentTab } from '@/src/components/booking-design/content-tab'
import { FeaturesTab } from '@/src/components/booking-design/features-tab'
import { BookingPreview } from '@/src/components/booking-design/booking-preview'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'

export default function BookingDesignPage() {
  const [business, setBusiness] = useState<any>(null)
  const [config, setConfig] = useState<BookingPageConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [bookingUrl, setBookingUrl] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load business data
      const businessData = await BusinessService.getCurrentBusiness()
      setBusiness(businessData)
      
      // Generate booking URL
      if (businessData) {
        const baseUrl = window.location.origin
        setBookingUrl(`${baseUrl}/book/${businessData.id}`)
      }
      
      // Load or create booking config
      if (businessData) {
        const configData = await BookingPageConfigService.getOrCreate(businessData.id)
        setConfig(configData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!business || !config) return

    try {
      setSaving(true)
      await BookingPageConfigService.update(business.id, {
        theme: config.theme,
        layout: config.layout,
        content: config.content,
        features: config.features,
        seo: config.seo,
        customCSS: config.customCSS,
      })
      toast.success('Änderungen erfolgreich gespeichert')
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Fehler beim Speichern der Änderungen')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (updates: Partial<BookingPageConfig>) => {
    if (!config) return
    setConfig({ ...config, ...updates })
    setHasChanges(true)
  }


  const openBookingPage = () => {
    window.open(bookingUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!business || !config) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Buchungsseite gestalten</h1>
          <p className="text-muted-foreground">
            Passen Sie das Aussehen und Verhalten Ihrer Online-Buchungsseite an
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openBookingPage}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Seite öffnen
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={cn(
              "transition-all",
              hasChanges && !saving && "bg-green-600 hover:bg-green-700 text-white shadow-lg animate-pulse"
            )}
            variant={hasChanges ? "default" : "outline"}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="design" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="design" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Design</span>
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    <span className="hidden sm:inline">Layout</span>
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Inhalte</span>
                  </TabsTrigger>
                  <TabsTrigger value="features" className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Features</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="design" className="space-y-4">
                  <DesignTab
                    config={config}
                    onUpdate={updateConfig}
                    businessId={business.id}
                  />
                </TabsContent>

                <TabsContent value="layout" className="space-y-4">
                  <LayoutTab
                    config={config}
                    onUpdate={updateConfig}
                  />
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <ContentTab
                    config={config}
                    onUpdate={updateConfig}
                  />
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                  <FeaturesTab
                    config={config}
                    onUpdate={updateConfig}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4 h-[calc(100vh-120px)]">
            <CardHeader>
              <CardTitle>Live-Vorschau</CardTitle>
              <CardDescription>
                Sehen Sie Ihre Änderungen in Echtzeit
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 h-[calc(100%-120px)]">
              <div className="bg-gray-100 rounded-lg overflow-hidden h-full">
                <div className="h-full overflow-y-auto">
                  <BookingPreview
                    config={config}
                    business={business}
                    device="mobile"
                    compact
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}