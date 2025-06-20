'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { BusinessService } from '@/src/lib/services/business.service'
import { EmployeeService } from '@/src/lib/services/employee.service'
import { useAuth } from '@/src/lib/auth/context'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'

export default function EmployeesPage() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState<string | null>(null)

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
        const employeesData = await EmployeeService.list(businessData.id)
        setEmployees(employeesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) return
    
    try {
      setIsDeleting(id)
      await EmployeeService.delete(id)
      toast.success('Mitarbeiter erfolgreich gelöscht')
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
      await EmployeeService.toggleActive(id)
      toast.success('Mitarbeiter aktualisiert')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Aktualisieren')
    } finally {
      setIsToggling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Bitte richten Sie zuerst Ihr Unternehmen ein.
        </p>
        <Button asChild className="mt-4">
          <Link href="/onboarding">Unternehmen einrichten</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mitarbeiter</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Mitarbeiter
          </p>
        </div>
        <Button asChild>
          <Link href="/employees/new">
            <Plus className="mr-2 h-4 w-4" />
            Mitarbeiter hinzufügen
          </Link>
        </Button>
      </div>

      {employees && employees.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee: any) => (
            <Card key={employee.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {employee.email}
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {employee.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(employee.id)}
                    disabled={isToggling === employee.id}
                  >
                    {employee.isActive ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {employee.employeeServices && employee.employeeServices.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Services:</p>
                    <div className="flex flex-wrap gap-1">
                      {employee.employeeServices.map((es: any) => (
                        <span
                          key={es.service.id}
                          className="text-xs bg-secondary px-2 py-1 rounded"
                        >
                          {es.service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/employees/${employee.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(employee.id)}
                    disabled={isDeleting === employee.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Sie haben noch keine Mitarbeiter hinzugefügt.
            </p>
            <Button asChild>
              <Link href="/employees/new">
                <Plus className="mr-2 h-4 w-4" />
                Ersten Mitarbeiter hinzufügen
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}