'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { Textarea } from '@/src/components/ui/textarea'
import { BusinessService } from '@/src/lib/services/business.service'
import { useAuth } from '@/src/lib/auth/context'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CheckCircle, Inbox, Link, Copy, QrCode, Edit, Save, X } from 'lucide-react'
import { generateSlug } from '@/src/lib/utils/slug'
import { QRCodeDialog } from '@/src/components/settings/qr-code-dialog'

export default function SettingsPage() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [bookingUrl, setBookingUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    description: '',
    urlSlug: ''
  })
  const [originalSlug, setOriginalSlug] = useState('')
  const [showQRCode, setShowQRCode] = useState(false)

  useEffect(() => {
    loadBusiness()
  }, [user])

  const loadBusiness = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const businessData = await BusinessService.getCurrentBusiness()
      setBusiness(businessData)
      
      // Initialize edit form
      if (businessData) {
        setEditForm({
          name: businessData.name || '',
          email: businessData.email || '',
          phone: businessData.phone || '',
          address: businessData.address || '',
          city: businessData.city || '',
          postalCode: businessData.postalCode || '',
          description: businessData.description || '',
          urlSlug: businessData.urlSlug || ''
        })
        setOriginalSlug(businessData.urlSlug || '')
        
        // Generate booking URL using urlSlug
        const baseUrl = window.location.origin
        setBookingUrl(`${baseUrl}/book/${businessData.urlSlug || businessData.id}`)
      }
    } catch (error) {
      console.error('Error loading business:', error)
      toast.error('Fehler beim Laden der Geschäftsdaten')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoAcceptToggle = async (checked: boolean) => {
    if (!business) return

    try {
      setUpdating(true)
      await BusinessService.updateBusiness(business.id, {
        acceptAppointmentsAutomatically: checked,
      })
      setBusiness({ ...business, acceptAppointmentsAutomatically: checked })
      toast.success(
        checked 
          ? 'Automatische Terminbestätigung aktiviert' 
          : 'Automatische Terminbestätigung deaktiviert'
      )
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Fehler beim Aktualisieren der Einstellungen')
    } finally {
      setUpdating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      toast.success('Link in die Zwischenablage kopiert')
    } catch (error) {
      toast.error('Fehler beim Kopieren des Links')
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - restore original values
      setEditForm({
        name: business.name || '',
        email: business.email || '',
        phone: business.phone || '',
        address: business.address || '',
        city: business.city || '',
        postalCode: business.postalCode || '',
        description: business.description || '',
        urlSlug: business.urlSlug || ''
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSaveBusinessInfo = async () => {
    if (!business) return

    try {
      setUpdating(true)
      
      // Check if URL slug changed and validate it
      if (editForm.urlSlug !== originalSlug && editForm.urlSlug) {
        // Validate URL slug format
        if (!/^[a-z0-9-]+$/.test(editForm.urlSlug)) {
          toast.error('URL darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten')
          return
        }
        
        // Check if slug is already taken
        const { data: existingSlug, error } = await BusinessService.checkSlugAvailability(editForm.urlSlug)
        if (existingSlug && existingSlug.id !== business.id) {
          toast.error('Diese URL ist bereits vergeben')
          return
        }
      }
      
      // Update business information
      const updatedBusiness = await BusinessService.updateBusiness(business.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        city: editForm.city,
        postalCode: editForm.postalCode,
        description: editForm.description || null,
        urlSlug: editForm.urlSlug || originalSlug
      })
      
      setBusiness(updatedBusiness)
      setOriginalSlug(editForm.urlSlug || originalSlug)
      setIsEditing(false)
      
      // Update booking URL if slug changed
      if (editForm.urlSlug !== originalSlug) {
        const baseUrl = window.location.origin
        setBookingUrl(`${baseUrl}/book/${editForm.urlSlug}`)
      }
      
      toast.success('Geschäftsinformationen erfolgreich aktualisiert')
    } catch (error: any) {
      console.error('Error updating business:', error)
      toast.error(error.message || 'Fehler beim Aktualisieren der Geschäftsinformationen')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Geschäftseinstellungen
        </p>
      </div>

      {business && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Geschäftsinformationen</CardTitle>
                  <CardDescription>
                    Aktualisieren Sie Ihre Geschäftsdaten
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditToggle}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Bearbeiten
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Geschäftsname</Label>
                  <Input 
                    value={isEditing ? editForm.name : business.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-Mail</Label>
                  <Input 
                    type="email"
                    value={isEditing ? editForm.email : business.email} 
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input 
                    type="tel"
                    value={isEditing ? editForm.phone : business.phone} 
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input 
                    value={isEditing ? editForm.address : business.address} 
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stadt</Label>
                  <Input 
                    value={isEditing ? editForm.city : business.city} 
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postleitzahl</Label>
                  <Input 
                    value={isEditing ? editForm.postalCode : business.postalCode} 
                    onChange={(e) => setEditForm({...editForm, postalCode: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
              </div>
              
              {/* Description field - full width */}
              <div className="space-y-2">
                <Label>Beschreibung (optional)</Label>
                <Textarea
                  value={isEditing ? editForm.description : (business.description || '')}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Beschreiben Sie Ihr Geschäft kurz..."
                />
              </div>
              
              {/* URL Slug field */}
              <div className="space-y-2">
                <Label>URL für Ihre Buchungsseite</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {window.location.origin}/book/
                  </span>
                  <Input
                    value={isEditing ? editForm.urlSlug : business.urlSlug}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
                      setEditForm({...editForm, urlSlug: value})
                    }}
                    disabled={!isEditing}
                    placeholder={generateSlug(business.name)}
                    className="flex-1"
                  />
                </div>
                {isEditing && editForm.urlSlug && (
                  <p className="text-sm text-muted-foreground">
                    Neue URL: {window.location.origin}/book/{editForm.urlSlug}
                  </p>
                )}
              </div>
              
              {/* Action buttons for editing */}
              {isEditing && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleEditToggle}
                    disabled={updating}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleSaveBusinessInfo}
                    disabled={updating}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updating ? 'Wird gespeichert...' : 'Speichern'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termineinstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie, wie Termine verarbeitet werden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auto-accept" className="text-base font-medium">
                      Termine automatisch bestätigen
                    </Label>
                    {business.acceptAppointmentsAutomatically ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Inbox className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {business.acceptAppointmentsAutomatically
                      ? "Neue Terminanfragen werden automatisch bestätigt"
                      : "Neue Terminanfragen müssen manuell im Posteingang bestätigt werden"}
                  </p>
                </div>
                <Switch
                  id="auto-accept"
                  checked={business.acceptAppointmentsAutomatically || false}
                  onCheckedChange={handleAutoAcceptToggle}
                  disabled={updating}
                />
              </div>
              
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm">
                  <strong>Hinweis:</strong> {business.acceptAppointmentsAutomatically 
                    ? "Bei aktivierter automatischer Bestätigung wird der Posteingang in der Navigation ausgeblendet, da alle Termine automatisch bestätigt werden."
                    : "Neue Terminanfragen von Kunden müssen manuell im Posteingang bestätigt werden. Termine, die Sie selbst erstellen, werden immer direkt bestätigt."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Öffentlicher Buchungslink</CardTitle>
              <CardDescription>
                Teilen Sie diesen Link mit Ihren Kunden, damit sie online Termine buchen können
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input 
                  value={bookingUrl} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyToClipboard}
                  title="Link kopieren"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => window.open(bookingUrl, '_blank')}
                  title="Link öffnen"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <QrCode className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">QR-Code für Ihre Buchungsseite</p>
                    <p className="text-sm text-muted-foreground">
                      Perfekt für Visitenkarten, Flyer und Schaufenster
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQRCode(true)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  QR-Code anzeigen
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Abonnement</CardTitle>
              <CardDescription>
                Ihr aktueller Tarif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-semibold capitalize">{business.subscriptionTier}</p>
                <p className="text-sm text-muted-foreground">
                  Upgrade-Optionen kommen bald
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* QR Code Dialog */}
      {business && (
        <QRCodeDialog
          open={showQRCode}
          onOpenChange={setShowQRCode}
          url={bookingUrl}
          businessName={business.name}
        />
      )}
    </div>
  )
}