'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { ServiceService } from '@/src/lib/services/service.service'
import { ServiceCategoryService } from '@/src/lib/services/service-category.service'
import { BusinessService } from '@/src/lib/services/business.service'
import { useAuth } from '@/src/lib/auth/context'
import { updateServiceSchema, type UpdateServiceInput } from '@/src/lib/schemas/service'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { use } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'

interface ServiceEditPageProps {
  params: Promise<{ id: string }>
}

export default function ServiceEditPage({ params }: ServiceEditPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = use(params)
  const [service, setService] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UpdateServiceInput>({
    resolver: zodResolver(updateServiceSchema),
  })

  useEffect(() => {
    loadService()
  }, [user, id])

  const loadService = async () => {
    if (!user || !id) return
    
    try {
      setLoading(true)
      const [serviceData, businessData] = await Promise.all([
        ServiceService.getById(id),
        BusinessService.getCurrentBusiness()
      ])
      setService(serviceData)
      
      if (businessData) {
        const categoriesData = await ServiceCategoryService.list(businessData.id)
        setCategories(categoriesData)
      }
      
      // Reset form with service data
      reset({
        name: serviceData.name,
        description: serviceData.description || '',
        duration: serviceData.duration,
        price: parseFloat(serviceData.price.toString()),
        bufferBefore: serviceData.bufferBefore,
        bufferAfter: serviceData.bufferAfter,
        categoryId: serviceData.categoryId || undefined,
      })
    } catch (error) {
      console.error('Error loading service:', error)
      toast.error('Fehler beim Laden des Services')
      router.push('/services')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: UpdateServiceInput) => {
    if (!id) return
    
    try {
      setIsSubmitting(true)
      await ServiceService.update(id, data)
      toast.success('Service erfolgreich aktualisiert')
      router.push('/services')
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Aktualisieren des Services')
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
          href="/services"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Services
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service bearbeiten</CardTitle>
          <CardDescription>
            Aktualisieren Sie die Details Ihrer Dienstleistung
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
                <Select 
                  onValueChange={(value) => setValue('categoryId', value || undefined)}
                  defaultValue={service?.categoryId || undefined}
                >
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

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/services')}
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