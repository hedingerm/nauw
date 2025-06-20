'use client'

import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { SwitchEnhanced as Switch } from '@/src/components/ui/switch-enhanced'
import { Button } from '@/src/components/ui/button'
import { Plus, X, Facebook, Instagram, Twitter, Linkedin, Youtube, Globe, Music2 } from 'lucide-react'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'

interface ContentTabProps {
  config: BookingPageConfig
  onUpdate: (updates: Partial<BookingPageConfig>) => void
}

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  website: Globe,
  tiktok: Music2,
}

export function ContentTab({ config, onUpdate }: ContentTabProps) {
  const handleContentChange = (field: keyof typeof config.content, value: any) => {
    onUpdate({
      content: {
        ...config.content,
        [field]: value,
      },
    })
  }

  const handleSocialLinkChange = (platform: string, url: string) => {
    const socialLinks = { ...config.content.socialLinks }
    const platformKey = platform as keyof typeof socialLinks
    
    // Ensure URLs have proper protocol
    if (url) {
      // Add https:// if no protocol is specified
      if (!url.match(/^https?:\/\//)) {
        url = `https://${url}`
      }
      socialLinks[platformKey] = url
    } else {
      delete socialLinks[platformKey]
    }
    
    handleContentChange('socialLinks', socialLinks)
  }

  const handleSEOChange = (field: keyof typeof config.seo, value: any) => {
    onUpdate({
      seo: {
        ...config.seo,
        [field]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Welcome Content */}
      <Card>
        <CardHeader>
          <CardTitle>Willkommensbereich</CardTitle>
          <CardDescription>
            Begrüßen Sie Ihre Kunden mit einer persönlichen Nachricht
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcomeTitle">Überschrift</Label>
            <Input
              id="welcomeTitle"
              value={config.content.welcomeTitle}
              onChange={(e) => handleContentChange('welcomeTitle', e.target.value)}
              placeholder="Termin buchen"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeText">Begrüßungstext</Label>
            <Textarea
              id="welcomeText"
              value={config.content.welcomeText}
              onChange={(e) => handleContentChange('welcomeText', e.target.value)}
              placeholder="Willkommen! Wählen Sie einen Service und buchen Sie Ihren Wunschtermin..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      <Card>
        <CardHeader>
          <CardTitle>Bestätigungsnachricht</CardTitle>
          <CardDescription>
            Was sollen Kunden nach erfolgreicher Buchung sehen?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="successMessage">Erfolgsmeldung</Label>
            <Textarea
              id="successMessage"
              value={config.content.successMessage}
              onChange={(e) => handleContentChange('successMessage', e.target.value)}
              placeholder="Vielen Dank für Ihre Buchung! Sie erhalten in Kürze eine Bestätigung per E-Mail."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Kundennotizen</CardTitle>
          <CardDescription>
            Konfigurieren Sie das Notizfeld für Kunden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requireNotes">Notizen erforderlich</Label>
              <p className="text-sm text-muted-foreground">
                Müssen Kunden eine Notiz hinterlassen?
              </p>
            </div>
            <Switch
              id="requireNotes"
              checked={config.content.requireNotes}
              onCheckedChange={(checked) => handleContentChange('requireNotes', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notesLabel">Beschriftung des Notizfeldes</Label>
            <Input
              id="notesLabel"
              value={config.content.notesLabel}
              onChange={(e) => handleContentChange('notesLabel', e.target.value)}
              placeholder="Anmerkungen oder besondere Wünsche"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>
            Verlinken Sie Ihre Social Media Profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showSocialLinks">Social Media Links anzeigen</Label>
              <p className="text-sm text-muted-foreground">
                Links werden im Footer der Buchungsseite angezeigt
              </p>
            </div>
            <Switch
              id="showSocialLinks"
              checked={config.content.showSocialLinks}
              onCheckedChange={(checked) => handleContentChange('showSocialLinks', checked)}
            />
          </div>

          {config.content.showSocialLinks && (
            <div className="space-y-3">
              {Object.entries(socialIcons).map(([platform, Icon]) => {
                const value = config.content.socialLinks[platform as keyof typeof config.content.socialLinks] || ''
                return (
                  <div key={platform} className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <Input
                      value={value}
                      onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                      placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                      className="flex-1"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SEO-Einstellungen</CardTitle>
          <CardDescription>
            Optimieren Sie Ihre Buchungsseite für Suchmaschinen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">Seitentitel</Label>
            <Input
              id="seoTitle"
              value={config.seo.title}
              onChange={(e) => handleSEOChange('title', e.target.value)}
              placeholder="Online Termin buchen - Ihr Geschäftsname"
            />
            <p className="text-sm text-muted-foreground">
              Wird in Suchergebnissen und Browser-Tabs angezeigt
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoDescription">Meta-Beschreibung</Label>
            <Textarea
              id="seoDescription"
              value={config.seo.description}
              onChange={(e) => handleSEOChange('description', e.target.value)}
              placeholder="Buchen Sie Ihren Termin online - schnell, einfach und bequem. Wählen Sie aus unseren Services und finden Sie Ihren Wunschtermin."
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Kurze Beschreibung für Suchmaschinen (max. 160 Zeichen)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoKeywords">Schlüsselwörter</Label>
            <div className="space-y-2">
              {config.seo.keywords.map((keyword, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={keyword}
                    onChange={(e) => {
                      const newKeywords = [...config.seo.keywords]
                      newKeywords[index] = e.target.value
                      handleSEOChange('keywords', newKeywords)
                    }}
                    placeholder="Schlüsselwort"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      const newKeywords = config.seo.keywords.filter((_, i) => i !== index)
                      handleSEOChange('keywords', newKeywords)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSEOChange('keywords', [...config.seo.keywords, ''])
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Schlüsselwort hinzufügen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}