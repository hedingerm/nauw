'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { BusinessHoursDisplay } from '@/src/components/schedules/business-hours-display'
import { EmployeeScheduleCard } from '@/src/components/schedules/employee-schedule-card'
import { BusinessService } from '@/src/lib/services/business.service'
import { EmployeeService } from '@/src/lib/services/employee.service'
import { useAuth } from '@/src/lib/auth/context'
import { toast } from 'sonner'
import { CalendarDays, Clock, Copy, Users, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'

export default function SchedulesPage() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [businessHours, setBusinessHours] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingBusinessHours, setEditingBusinessHours] = useState(false)
  const [modifiedEmployees, setModifiedEmployees] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadBusinessData()
  }, [user])

  const loadBusinessData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const businessData = await BusinessService.getCurrentBusiness()
      setBusiness(businessData)
      
      // Load employees
      if (businessData) {
        const employeesData = await EmployeeService.list(businessData.id)
        setEmployees(employeesData.filter(e => e.isActive && e.canPerformServices))
      }
      
      // Transform business hours from database format to UI format
      if (businessData?.businessHours && typeof businessData.businessHours === 'object') {
        const transformedHours: any = {}
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const businessHoursData = businessData.businessHours as any
        
        days.forEach(day => {
          const dayHours = businessHoursData[day]
          if (dayHours && typeof dayHours === 'object') {
            transformedHours[day] = {
              isOpen: true,
              openTime: dayHours.open,
              closeTime: dayHours.close,
              hasLunchBreak: !!dayHours.lunchStart,
              lunchStart: dayHours.lunchStart,
              lunchEnd: dayHours.lunchEnd,
            }
          } else {
            transformedHours[day] = {
              isOpen: false,
              openTime: '09:00',
              closeTime: '18:00',
              hasLunchBreak: false,
            }
          }
        })
        
        setBusinessHours(transformedHours)
      }
    } catch (error) {
      console.error('Error loading business data:', error)
      toast.error('Fehler beim Laden der Geschäftsdaten')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBusinessHours = async (hours: any) => {
    if (!business) return
    
    try {
      setSaving(true)
      
      // Transform business hours back to database format
      const transformedBusinessHours: any = {}
      Object.entries(hours).forEach(([day, dayHours]: [string, any]) => {
        if (dayHours.isOpen) {
          transformedBusinessHours[day] = {
            open: dayHours.openTime,
            close: dayHours.closeTime,
            ...(dayHours.hasLunchBreak && {
              lunchStart: dayHours.lunchStart,
              lunchEnd: dayHours.lunchEnd,
            }),
          }
        }
      })
      
      await BusinessService.updateBusiness(business.id, {
        businessHours: transformedBusinessHours,
      })
      
      toast.success('Öffnungszeiten erfolgreich gespeichert')
      setEditingBusinessHours(false)
      setBusinessHours(hours)
    } catch (error) {
      console.error('Error saving business hours:', error)
      toast.error('Fehler beim Speichern der Öffnungszeiten')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEmployeeHours = async (employeeId: string, hours: any) => {
    try {
      setSaving(true)
      
      // Transform employee hours to database format
      const transformedHours: any = {}
      Object.entries(hours).forEach(([day, dayHours]: [string, any]) => {
        if (dayHours) {
          transformedHours[day] = {
            start: dayHours.start,
            end: dayHours.end,
            ...(dayHours.hasLunchBreak && {
              hasLunchBreak: true,
              lunchStart: dayHours.lunchStart,
              lunchEnd: dayHours.lunchEnd,
            }),
          }
        }
      })
      
      await EmployeeService.update(employeeId, {
        workingHours: transformedHours,
      })
      
      toast.success('Arbeitszeiten erfolgreich gespeichert')
      setModifiedEmployees(prev => {
        const next = new Set(prev)
        next.delete(employeeId)
        return next
      })
      
      await loadBusinessData() // Reload to get updated data
    } catch (error) {
      console.error('Error saving employee hours:', error)
      toast.error('Fehler beim Speichern der Arbeitszeiten')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyBusinessHoursToAll = async () => {
    if (!businessHours || employees.length === 0) return
    
    try {
      setSaving(true)
      
      // Transform business hours to employee format
      const transformedHours: any = {}
      Object.entries(businessHours).forEach(([day, dayHours]: [string, any]) => {
        if (dayHours.isOpen) {
          transformedHours[day] = {
            start: dayHours.openTime,
            end: dayHours.closeTime,
            ...(dayHours.hasLunchBreak && {
              hasLunchBreak: true,
              lunchStart: dayHours.lunchStart,
              lunchEnd: dayHours.lunchEnd,
            }),
          }
        }
      })
      
      // Update all employees
      await Promise.all(
        employees.map(employee => 
          EmployeeService.update(employee.id, {
            workingHours: transformedHours,
          })
        )
      )
      
      toast.success('Geschäftszeiten auf alle Mitarbeiter übertragen')
      await loadBusinessData()
    } catch (error) {
      console.error('Error copying hours:', error)
      toast.error('Fehler beim Übertragen der Zeiten')
    } finally {
      setSaving(false)
    }
  }

  const hasCustomHours = (employee: any) => {
    return employee.workingHours && Object.keys(employee.workingHours).length > 0
  }

  const getEmployeesWithoutSchedule = () => {
    return employees.filter(e => !hasCustomHours(e))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const employeesWithoutSchedule = getEmployeesWithoutSchedule()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zeitpläne</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Geschäfts- und Mitarbeiterzeiten an einem Ort
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/schedules/exceptions">
            <CalendarDays className="mr-2 h-4 w-4" />
            Ausnahmen verwalten
          </Link>
        </Button>
      </div>

      {/* Business Hours Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Geschäftszeiten</CardTitle>
            </div>
            <div className="flex gap-2">
              {employees.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyBusinessHoursToAll}
                  disabled={saving}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Auf alle Mitarbeiter übertragen
                </Button>
              )}
              <Button
                variant={editingBusinessHours ? "default" : "outline"}
                size="sm"
                onClick={() => setEditingBusinessHours(!editingBusinessHours)}
              >
                {editingBusinessHours ? 'Abbrechen' : 'Bearbeiten'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Diese Zeiten gelten als Standard für alle Mitarbeiter ohne individuelle Arbeitszeiten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {businessHours && (
            <BusinessHoursDisplay
              hours={businessHours}
              onSave={handleSaveBusinessHours}
              editable={editingBusinessHours}
              saving={saving}
            />
          )}
        </CardContent>
      </Card>

      {/* Alert for employees without schedule */}
      {employeesWithoutSchedule.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{employeesWithoutSchedule.length} Mitarbeiter</strong> verwenden die Standard-Geschäftszeiten.
            Sie können individuelle Arbeitszeiten festlegen oder die Geschäftszeiten auf alle übertragen.
          </AlertDescription>
        </Alert>
      )}

      {/* Employees Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Mitarbeiter-Arbeitszeiten</h2>
            <Badge variant="outline" className="ml-2">
              {employees.length} Mitarbeiter
            </Badge>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-600"></div>
              <span>Standard</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-600"></div>
              <span>Arbeitet</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-600"></div>
              <span>Frei</span>
            </div>
          </div>
        </div>

        {employees.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Noch keine Mitarbeiter vorhanden.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/employees/new">Mitarbeiter hinzufügen</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {employees.map((employee) => (
              <EmployeeScheduleCard
                key={employee.id}
                employee={employee}
                businessHours={businessHours}
                onSave={(hours) => handleSaveEmployeeHours(employee.id, hours)}
                onModify={(modified) => {
                  setModifiedEmployees(prev => {
                    const next = new Set(prev)
                    if (modified) {
                      next.add(employee.id)
                    } else {
                      next.delete(employee.id)
                    }
                    return next
                  })
                }}
                isModified={modifiedEmployees.has(employee.id)}
                saving={saving}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}