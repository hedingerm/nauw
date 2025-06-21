'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Checkbox } from '@/src/components/ui/checkbox'
import { BusinessService } from '@/src/lib/services/business.service'
import { ServiceService } from '@/src/lib/services/service.service'
import { ServiceCategoryService } from '@/src/lib/services/service-category.service'
import { EmployeeService } from '@/src/lib/services/employee.service'
import { useAuth } from '@/src/lib/auth/context'
import { createServiceSchema, type CreateServiceInput } from '@/src/lib/schemas/service'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'

export default function NewServicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadBusiness()
  }, [user])

  const loadBusiness = async () => {
    if (!user) return
    try {
      const businessData = await BusinessService.getCurrentBusiness()
      setBusiness(businessData)
      
      if (businessData) {
        const categoriesData = await ServiceCategoryService.list(businessData.id)
        setCategories(categoriesData)
        
        const employeesData = await EmployeeService.list(businessData.id)
        setEmployees(employeesData.filter(e => e.isActive && e.canPerformServices))
      }
    } catch (error) {
      console.error('Error loading business:', error)
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: '',
      description: '',
      duration: 30,
      price: 0,
      bufferBefore: 0,
      bufferAfter: 0,
      categoryId: undefined,
      employeeIds: [],
    },
  })

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => {
      const newEmployees = prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
      setValue('employeeIds', newEmployees)
      return newEmployees
    })
  }

  const onSubmit = async (data: CreateServiceInput) => {
    if (!business?.id) return
    
    try {
      setIsSubmitting(true)
      await ServiceService.create(business.id, {
        ...data,
        employeeIds: selectedEmployees,
      })
      toast.success('Service erfolgreich erstellt')
      router.push('/services')
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Erstellen des Services')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/services"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Services
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neuen Service erstellen</CardTitle>
          <CardDescription>
            Fügen Sie eine neue Dienstleistung zu Ihrem Angebot hinzu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="z.B. Haarschnitt"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Beschreiben Sie den Service..."
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie (optional)</Label>
                <Select onValueChange={(value) => setValue('categoryId', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Services ohne Kategorie werden unter &quot;Unkategorisiert&quot; angezeigt
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Dauer (Minuten)</Label>
                <Input
                  id="duration"
                  type="number"
                  {...register('duration', { valueAsNumber: true })}
                  placeholder="30"
                />
                {errors.duration && (
                  <p className="text-sm text-destructive">{errors.duration.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preis (CHF)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bufferBefore">Puffer vorher (Minuten)</Label>
                <Input
                  id="bufferBefore"
                  type="number"
                  {...register('bufferBefore', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.bufferBefore && (
                  <p className="text-sm text-destructive">{errors.bufferBefore.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bufferAfter">Puffer nachher (Minuten)</Label>
                <Input
                  id="bufferAfter"
                  type="number"
                  {...register('bufferAfter', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.bufferAfter && (
                  <p className="text-sm text-destructive">{errors.bufferAfter.message}</p>
                )}
              </div>
            </div>

            {employees.length > 0 && (
              <div className="space-y-2">
                <Label>Zugewiesene Mitarbeiter</Label>
                <div className="space-y-2 border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`employee-${employee.id}`}
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => toggleEmployee(employee.id)}
                      />
                      <Label
                        htmlFor={`employee-${employee.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {employee.name}
                        {employee.role && (
                          <span className="text-muted-foreground ml-2">
                            ({employee.role})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Wählen Sie die Mitarbeiter aus, die diesen Service durchführen können
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/services')}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Wird erstellt...' : 'Service erstellen'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}