'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Checkbox } from '@/src/components/ui/checkbox'
import { BusinessService } from '@/src/lib/services/business.service'
import { ServiceService } from '@/src/lib/services/service.service'
import { EmployeeService } from '@/src/lib/services/employee.service'
import { useAuth } from '@/src/lib/auth/context'
import { createEmployeeSchema, type CreateEmployeeInput } from '@/src/lib/schemas/employee'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

export default function NewEmployeePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      workingHours: {},
      serviceIds: [],
    },
  })

  useEffect(() => {
    loadBusinessAndServices()
  }, [user])

  const loadBusinessAndServices = async () => {
    if (!user) return
    try {
      const businessData = await BusinessService.getCurrentBusiness()
      if (businessData) {
        setBusiness(businessData)
        const servicesData = await ServiceService.list(businessData.id)
        setServices(servicesData.filter(s => s.isActive))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      const newServices = prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
      setValue('serviceIds', newServices)
      return newServices
    })
  }

  const onSubmit = async (data: CreateEmployeeInput) => {
    if (!business?.id) return
    
    try {
      setIsSubmitting(true)
      await EmployeeService.create(business.id, {
        ...data,
        serviceIds: selectedServices,
      })
      toast.success('Mitarbeiter erfolgreich erstellt')
      router.push('/employees')
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Erstellen des Mitarbeiters')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/employees"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Mitarbeiter
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neuen Mitarbeiter hinzufügen</CardTitle>
          <CardDescription>
            Fügen Sie einen neuen Mitarbeiter zu Ihrem Team hinzu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
              <Label htmlFor="email">E-Mail</Label>
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
              <Label htmlFor="phone">Telefon (optional)</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="+41 79 123 45 67"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {services.length > 0 && (
              <div className="space-y-2">
                <Label>Zugewiesene Services</Label>
                <div className="space-y-2 border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <Label
                        htmlFor={`service-${service.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {service.name} ({service.duration} Min.)
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Wählen Sie die Services aus, die dieser Mitarbeiter durchführen kann
                </p>
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg text-sm">
              <p>
                <strong>Hinweis:</strong> Die Arbeitszeiten können Sie nach dem Erstellen im Bereich &quot;Zeitpläne&quot; festlegen.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/employees')}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Wird erstellt...' : 'Mitarbeiter erstellen'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}