'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BusinessService } from '@/src/lib/services/business.service'
import { CustomerService } from '@/src/lib/services/customer.service'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Badge } from '@/src/components/ui/badge'
import { ArrowLeft, Save, Trash2, AlertCircle } from 'lucide-react'
import { updateCustomerSchema, type UpdateCustomerInput } from '@/src/lib/schemas/customer'
import { toast } from 'sonner'
import { formatPhoneInput, getSwissPhonePlaceholder, formatPhoneForDisplay } from '@/src/lib/utils/normalize'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog'
import type { Database } from '@/src/lib/supabase/database.types'

type Customer = Database['public']['Tables']['Customer']['Row'] & {
  appointmentCount?: number
}

interface EditCustomerPageProps {
  params: Promise<{ id: string }>
}

export default function EditCustomerPage({ params: paramsPromise }: EditCustomerPageProps) {
  const params = use(paramsPromise)
  const router = useRouter()
  const customerId = params.id

  const [business, setBusiness] = useState<any>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<UpdateCustomerInput>({
    resolver: zodResolver(updateCustomerSchema),
  })

  useEffect(() => {
    loadBusiness()
  }, [])

  useEffect(() => {
    if (business) {
      loadCustomer()
    }
  }, [business, customerId])

  const loadBusiness = async () => {
    try {
      const businessData = await BusinessService.getCurrentBusiness()
      setBusiness(businessData)
    } catch (error) {
      console.error('Error loading business:', error)
      toast.error('Fehler beim Laden der Geschäftsdaten')
    }
  }

  const loadCustomer = async () => {
    if (!customerId) return

    try {
      setLoading(true)
      const customerData = await CustomerService.getById(customerId)
      
      if (!customerData) {
        toast.error('Kunde nicht gefunden')
        router.push('/customers')
        return
      }

      setCustomer(customerData)
      
      // Reset form with customer data
      const [firstName, ...lastNameParts] = customerData.name.split(' ')
      const lastName = lastNameParts.join(' ')
      
      reset({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone || undefined,
        notes: customerData.notes || undefined,
        address: customerData.address || undefined,
        city: customerData.city || undefined,
        postalCode: customerData.postalCode || undefined,
        birthday: customerData.birthday || undefined,
        gender: (customerData.gender || undefined) as 'male' | 'female' | 'other' | undefined,
        preferredContactMethod: (customerData.preferredContactMethod || undefined) as 'email' | 'phone' | 'sms' | undefined,
        marketingConsent: customerData.marketingConsent || false,
        source: customerData.source || undefined,
        tags: customerData.tags || undefined,
        vipStatus: customerData.vipStatus || false,
        isActive: customerData.isActive,
      })
    } catch (error) {
      console.error('Error loading customer:', error)
      toast.error('Fehler beim Laden der Kundendaten')
      router.push('/customers')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: UpdateCustomerInput) => {
    if (!customer) return

    try {
      setSaving(true)
      
      // Only send changed fields - filter out undefined values
      const changes: UpdateCustomerInput = {}
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          (changes as any)[key] = value
        }
      })

      await CustomerService.update(customerId, changes)
      toast.success('Kundendaten erfolgreich aktualisiert')
      router.push(`/customers/${customerId}`)
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error('Fehler beim Aktualisieren der Kundendaten')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!customer) return

    try {
      setDeleting(true)
      await CustomerService.delete(customerId)
      toast.success('Kunde erfolgreich gelöscht')
      router.push('/customers')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Fehler beim Löschen des Kunden')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const marketingConsent = watch('marketingConsent')
  const vipStatus = watch('vipStatus')
  const isActive = watch('isActive')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">Kundendaten werden geladen...</div>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/customers/${customerId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kunde bearbeiten</h1>
            <p className="text-muted-foreground">
              Aktualisieren Sie die Kundendaten
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Löschen
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Kundenstatus</Label>
                <p className="text-sm text-muted-foreground">
                  Inaktive Kunden werden in Listen ausgeblendet
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
                />
                <Label htmlFor="isActive" className="font-normal">
                  {isActive ? 'Aktiv' : 'Inaktiv'}
                </Label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="vipStatus">VIP-Status</Label>
                <p className="text-sm text-muted-foreground">
                  VIP-Kunden erhalten besondere Aufmerksamkeit
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="vipStatus"
                  checked={vipStatus}
                  onCheckedChange={(checked) => setValue('vipStatus', checked as boolean)}
                />
                <Label htmlFor="vipStatus" className="font-normal">
                  VIP-Kunde
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Grundinformationen</CardTitle>
            <CardDescription>
              Bearbeiten Sie die wichtigsten Kundendaten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Max Mustermann"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="max@beispiel.ch"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  placeholder={getSwissPhonePlaceholder()}
                  onChange={(e) => {
                    const formatted = formatPhoneInput(e.target.value)
                    setValue('phone', formatted, { shouldDirty: true })
                  }}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Format: 079 123 45 67
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday">Geburtstag</Label>
                <Input
                  id="birthday"
                  type="date"
                  {...register('birthday')}
                />
                {errors.birthday && (
                  <p className="text-sm text-destructive">{errors.birthday.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Geschlecht</Label>
                <Select 
                  value={watch('gender') || ''} 
                  onValueChange={(value) => setValue('gender', value as any, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Männlich</SelectItem>
                    <SelectItem value="female">Weiblich</SelectItem>
                    <SelectItem value="other">Andere</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Quelle</Label>
                <Input
                  id="source"
                  {...register('source')}
                  placeholder="z.B. Google, Empfehlung, etc."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Adressinformationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Straße und Hausnummer</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Musterstraße 123"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postalCode">PLZ</Label>
                <Input
                  id="postalCode"
                  {...register('postalCode')}
                  placeholder="8000"
                />
                {errors.postalCode && (
                  <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ort</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Zürich"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communication & Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Kommunikation & Einstellungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preferredContactMethod">Bevorzugte Kontaktmethode</Label>
              <Select 
                value={watch('preferredContactMethod') || 'email'}
                onValueChange={(value) => setValue('preferredContactMethod', value as any, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-Mail</SelectItem>
                  <SelectItem value="phone">Telefon</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketingConsent"
                checked={marketingConsent}
                onCheckedChange={(checked) => setValue('marketingConsent', checked as boolean, { shouldDirty: true })}
              />
              <Label htmlFor="marketingConsent" className="font-normal">
                Der Kunde hat der Zusendung von Marketing-Nachrichten zugestimmt
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                {...register('tags')}
                placeholder="Stammkunde, Newsletter, etc. (kommagetrennt)"
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  setValue('tags', tags, { shouldDirty: true })
                }}
                value={(watch('tags') || []).join(', ')}
              />
              <p className="text-xs text-muted-foreground">
                Tags helfen bei der Organisation und Filterung
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notizen</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('notes')}
              placeholder="Zusätzliche Informationen über den Kunden..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isDirty && (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>Sie haben ungespeicherte Änderungen</span>
              </>
            )}
          </div>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/customers/${customerId}`)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving || !isDirty}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kunde löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie den Kunden &quot;{customer.name}&quot; löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
              {customer.appointmentCount && customer.appointmentCount > 0 && (
                <span className="block mt-2 font-semibold text-destructive">
                  Achtung: Dieser Kunde hat {customer.appointmentCount} Termine. 
                  Diese werden ebenfalls gelöscht.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Wird gelöscht...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}