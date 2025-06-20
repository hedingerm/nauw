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
import { updateEmployeeSchema, type UpdateEmployeeInput } from '@/src/lib/schemas/employee'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { use } from 'react'

interface EmployeeEditPageProps {
  params: Promise<{ id: string }>
}

export default function EmployeeEditPage({ params }: EmployeeEditPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = use(params)
  const [employee, setEmployee] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(updateEmployeeSchema),
  })

  useEffect(() => {
    loadData()
  }, [user, id])

  const loadData = async () => {
    if (!user || !id) return
    
    try {
      setLoading(true)
      
      // Load business first
      const businessData = await BusinessService.getCurrentBusiness()
      if (businessData) {
        setBusiness(businessData)
        
        // Load services
        const servicesData = await ServiceService.list(businessData.id)
        setServices(servicesData.filter(s => s.isActive))
        
        // Load employee
        const employeeData = await EmployeeService.getById(id)
        setEmployee(employeeData)
        
        // Set selected services
        const assignedServiceIds = employeeData.employeeServices?.map(es => es.serviceId) || []
        setSelectedServices(assignedServiceIds)
        
        // Reset form with employee data
        reset({
          name: employeeData.name,
          email: employeeData.email,
          phone: employeeData.phone || '',
          serviceIds: assignedServiceIds,
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Fehler beim Laden der Daten')
      router.push('/employees')
    } finally {
      setLoading(false)
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

  const onSubmit = async (data: UpdateEmployeeInput) => {
    if (!id) return
    
    try {
      setIsSubmitting(true)
      await EmployeeService.update(id, {
        ...data,
        serviceIds: selectedServices,
      })
      toast.success('Mitarbeiter erfolgreich aktualisiert')
      router.push('/employees')
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Aktualisieren des Mitarbeiters')
    } finally {
      setIsSubmitting(false)
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
          <CardTitle>Mitarbeiter bearbeiten</CardTitle>
          <CardDescription>
            Aktualisieren Sie die Informationen Ihres Mitarbeiters
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

            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p>
                <strong>Status:</strong> {employee?.isActive ? 'Aktiv' : 'Inaktiv'}
              </p>
              <p>
                <strong>Hinweis:</strong> Die Arbeitszeiten können Sie im Bereich &quot;Zeitpläne&quot; anpassen.
              </p>
              <p>
                Den Aktivitätsstatus können Sie direkt in der Mitarbeiterübersicht ändern.
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
                {isSubmitting ? 'Wird gespeichert...' : 'Änderungen speichern'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}