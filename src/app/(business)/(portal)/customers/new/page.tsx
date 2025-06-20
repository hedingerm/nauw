'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { ArrowLeft } from 'lucide-react'
import { createCustomerSchema, type CreateCustomerInput } from '@/src/lib/schemas/customer'
import { toast } from 'sonner'
import { formatPhoneInput, getSwissPhonePlaceholder } from '@/src/lib/utils/normalize'

export default function NewCustomerPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      preferredContactMethod: 'email',
      marketingConsent: false,
      vipStatus: false,
      tags: [],
    },
  })

  useEffect(() => {
    loadBusiness()
  }, [])

  const loadBusiness = async () => {
    try {
      const businessData = await BusinessService.getCurrentBusiness()
      setBusiness(businessData)
    } catch (error) {
      console.error('Error loading business:', error)
      toast.error('Fehler beim Laden der Geschäftsdaten')
    }
  }

  const onSubmit = async (data: CreateCustomerInput) => {
    if (!business) return

    try {
      setLoading(true)
      const customer = await CustomerService.create(business.id, data)
      toast.success('Kunde erfolgreich erstellt')
      router.push(`/customers/${customer.id}`)
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error('Fehler beim Erstellen des Kunden')
    } finally {
      setLoading(false)
    }
  }

  const marketingConsent = watch('marketingConsent')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/customers')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neuer Kunde</h1>
          <p className="text-muted-foreground">
            Erstellen Sie einen neuen Kundeneintrag
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Grundinformationen</CardTitle>
            <CardDescription>
              Erfassen Sie die wichtigsten Kundendaten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                    setValue('phone', formatted)
                  }}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Sie können die Nummer in jedem Format eingeben: 079 123 45 67, 0791234567, +41791234567
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
                <Select onValueChange={(value) => setValue('gender', value as any)}>
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

        <Card>
          <CardHeader>
            <CardTitle>Kommunikation & Einstellungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preferredContactMethod">Bevorzugte Kontaktmethode</Label>
              <Select 
                defaultValue="email"
                onValueChange={(value) => setValue('preferredContactMethod', value as any)}
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
                onCheckedChange={(checked) => setValue('marketingConsent', checked as boolean)}
              />
              <Label htmlFor="marketingConsent" className="font-normal">
                Der Kunde hat der Zusendung von Marketing-Nachrichten zugestimmt
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="vipStatus"
                onCheckedChange={(checked) => setValue('vipStatus', checked as boolean)}
              />
              <Label htmlFor="vipStatus" className="font-normal">
                Als VIP-Kunde markieren
              </Label>
            </div>
          </CardContent>
        </Card>

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

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/customers')}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Wird erstellt...' : 'Kunde erstellen'}
          </Button>
        </div>
      </form>
    </div>
  )
}