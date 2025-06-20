'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { BusinessService } from '@/src/lib/services/business.service'
import { useAuth } from '@/src/lib/auth/context'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CheckCircle, Inbox, Link, Copy, QrCode } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [bookingUrl, setBookingUrl] = useState('')

  useEffect(() => {
    loadBusiness()
  }, [user])

  const loadBusiness = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const businessData = await BusinessService.getCurrentBusiness()
      setBusiness(businessData)
      
      // Generate booking URL
      if (businessData) {
        const baseUrl = window.location.origin
        setBookingUrl(`${baseUrl}/book/${businessData.id}`)
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
              <CardTitle>Geschäftsinformationen</CardTitle>
              <CardDescription>
                Aktualisieren Sie Ihre Geschäftsdaten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Geschäftsname</Label>
                  <Input value={business.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>E-Mail</Label>
                  <Input value={business.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={business.phone} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input value={business.address} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Stadt</Label>
                  <Input value={business.city} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Postleitzahl</Label>
                  <Input value={business.postalCode} disabled />
                </div>
              </div>
              <Button disabled>Bearbeiten (Kommt bald)</Button>
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
              
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-3">
                  <QrCode className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">QR-Code generieren</p>
                    <p className="text-sm text-muted-foreground">
                      Erstellen Sie einen QR-Code für Ihre Visitenkarten oder Flyer. 
                      Diese Funktion kommt bald!
                    </p>
                  </div>
                </div>
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
    </div>
  )
}