'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { BusinessService } from '@/src/lib/services/business.service'
import { ServiceService, type ServicesGroupedByCategory } from '@/src/lib/services/service.service'
import { ServiceCategoryService, type ServiceCategoryWithCount } from '@/src/lib/services/service-category.service'
import { useAuth } from '@/src/lib/auth/context'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Tag, Layers, Settings2, Edit2, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/src/lib/supabase/database.types'
import { Badge } from '@/src/components/ui/badge'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'

type Service = Database['public']['Tables']['Service']['Row']

interface CategoryFormData {
  name: string
  description: string
}

export default function ServicesPage() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [serviceGroups, setServiceGroups] = useState<ServicesGroupedByCategory[]>([])
  const [categories, setCategories] = useState<ServiceCategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState<string | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategoryWithCount | null>(null)
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
  })
  const [savingCategory, setSavingCategory] = useState(false)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const businessData = await BusinessService.getCurrentBusiness()
      if (businessData) {
        setBusiness(businessData)
        const [groupedServices, categoriesData] = await Promise.all([
          ServiceService.listGroupedByCategory(businessData.id),
          ServiceCategoryService.list(businessData.id)
        ])
        setServiceGroups(groupedServices)
        setCategories(categoriesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Service wirklich löschen?')) return
    
    try {
      setIsDeleting(id)
      await ServiceService.delete(id)
      toast.success('Service erfolgreich gelöscht')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Löschen')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      setIsToggling(id)
      await ServiceService.toggleActive(id)
      toast.success('Service aktualisiert')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Aktualisieren')
    } finally {
      setIsToggling(null)
    }
  }

  // Category management functions
  const handleOpenCategoryDialog = (category?: ServiceCategoryWithCount) => {
    if (category) {
      setEditingCategory(category)
      setCategoryFormData({
        name: category.name,
        description: category.description || '',
      })
    } else {
      setEditingCategory(null)
      setCategoryFormData({
        name: '',
        description: '',
      })
    }
    setCategoryDialogOpen(true)
  }

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false)
    setEditingCategory(null)
    setCategoryFormData({
      name: '',
      description: '',
    })
  }

  const handleSubmitCategory = async () => {
    if (!business || !categoryFormData.name.trim()) return

    try {
      setSavingCategory(true)
      
      if (editingCategory) {
        await ServiceCategoryService.update(editingCategory.id, {
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim() || undefined,
        })
        toast.success('Kategorie erfolgreich aktualisiert')
      } else {
        await ServiceCategoryService.create(business.id, {
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim() || undefined,
          displayOrder: categories.length,
        })
        toast.success('Kategorie erfolgreich erstellt')
      }
      
      await loadData()
      handleCloseCategoryDialog()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Speichern der Kategorie')
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (category: ServiceCategoryWithCount) => {
    if (!confirm(`Möchten Sie die Kategorie "${category.name}" wirklich löschen? Services in dieser Kategorie werden zu "Unkategorisiert" verschoben.`)) {
      return
    }

    try {
      await ServiceCategoryService.delete(category.id)
      toast.success('Kategorie erfolgreich gelöscht')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Löschen der Kategorie')
    }
  }

  const handleReorderCategories = async (categories: ServiceCategoryWithCount[]) => {
    if (!business) return

    try {
      const updates = categories.map((cat, index) => ({
        id: cat.id,
        displayOrder: index,
      }))
      
      await ServiceCategoryService.updateOrder(business.id, updates)
      setCategories(categories)
      toast.success('Reihenfolge erfolgreich aktualisiert')
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Aktualisieren der Reihenfolge')
      await loadData()
    }
  }

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= categories.length) return
    
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]]
    handleReorderCategories(newCategories)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Services & Kategorien</h1>
        <p className="text-muted-foreground">Verwalten Sie Ihre Dienstleistungen und deren Kategorien</p>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="categories">Kategorien</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Ihre Services</h2>
            <Button asChild>
              <Link href="/services/new">
                <Plus className="mr-2 h-4 w-4" />
                Neue Dienstleistung
              </Link>
            </Button>
          </div>

      {serviceGroups.length === 0 || serviceGroups.every(g => g.services.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Noch keine Dienstleistungen vorhanden</p>
            <Button asChild>
              <Link href="/services/new">
                <Plus className="mr-2 h-4 w-4" />
                Erste Dienstleistung erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {serviceGroups.map((group) => (
            <div key={group.category?.id || 'uncategorized'}>
              <div className="flex items-center gap-2 mb-4">
                {group.category ? (
                  <>
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">{group.category.name}</h2>
                    {group.category.description && (
                      <span className="text-sm text-muted-foreground">– {group.category.description}</span>
                    )}
                  </>
                ) : (
                  <>
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Unkategorisiert</h2>
                  </>
                )}
                <Badge variant="secondary" className="ml-auto">
                  {group.services.length} {group.services.length === 1 ? 'Service' : 'Services'}
                </Badge>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.services.map((service) => (
                  <Card key={service.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{service.name}</CardTitle>
                          <CardDescription>{service.duration} Minuten</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(service.id)}
                          disabled={isToggling === service.id}
                        >
                          {service.isActive ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-2xl font-bold">
                          CHF {service.price.toLocaleString('de-CH', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </p>
                        {service.description && (
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {service.bufferBefore > 0 && <p>Puffer vorher: {service.bufferBefore} Min.</p>}
                          {service.bufferAfter > 0 && <p>Puffer nachher: {service.bufferAfter} Min.</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <Link href={`/services/${service.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(service.id)}
                          disabled={isDeleting === service.id}
                          className="flex-1"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Löschen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Kategorien verwalten</h2>
            <Button onClick={() => handleOpenCategoryDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Neue Kategorie
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Noch keine Kategorien vorhanden
                </p>
                <Button onClick={() => handleOpenCategoryDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Erste Kategorie erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {categories.map((category, index) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === 0}
                            onClick={() => moveCategory(index, 'up')}
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === categories.length - 1}
                            onClick={() => moveCategory(index, 'down')}
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Tag className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            {category.description && (
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          {category.serviceCount || 0} {category.serviceCount === 1 ? 'Service' : 'Services'}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Aktionen
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenCategoryDialog(category)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCategory(category)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Bearbeiten Sie die Details der Kategorie'
                : 'Erstellen Sie eine neue Kategorie für Ihre Services'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="z.B. Haarschnitt, Massage, Beratung"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder="Kurze Beschreibung der Kategorie"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCategoryDialog} disabled={savingCategory}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmitCategory} 
              disabled={savingCategory || !categoryFormData.name.trim()}
            >
              {editingCategory ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}