'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/lib/auth/context'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { BusinessService } from '@/src/lib/services/business.service'
import { EmployeeService } from '@/src/lib/services/employee.service'
import { ScheduleExceptionService, type ConsolidatedExceptionGroup } from '@/src/lib/services/schedule-exception.service'
import { ScheduleExceptionDialog } from '@/src/components/schedules/schedule-exception-dialog'
import { ScheduleExceptionTable } from '@/src/components/schedules/schedule-exception-table'
import { ScheduleExceptionTableConsolidated } from '@/src/components/schedules/schedule-exception-table-consolidated'
import { ArrowLeft, Plus, Calendar, Filter, LayersIcon } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { ScheduleExceptionWithRelations } from '@/src/lib/schemas/schedule-exception'
import { Badge } from '@/src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'

export default function ScheduleExceptionsPage() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [exceptions, setExceptions] = useState<ScheduleExceptionWithRelations[]>([])
  const [consolidatedGroups, setConsolidatedGroups] = useState<ConsolidatedExceptionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterEmployee, setFilterEmployee] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'consolidated' | 'list' | 'timeline'>('consolidated')

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
        
        // Load employees
        const employeesData = await EmployeeService.list(businessData.id)
        setEmployees(employeesData.filter(e => e.isActive && e.canPerformServices))
        
        // Load exceptions for the next 6 months
        const dateFrom = new Date().toISOString().split('T')[0]
        const dateTo = new Date()
        dateTo.setMonth(dateTo.getMonth() + 6)
        
        const exceptionsData = await ScheduleExceptionService.list({
          businessId: businessData.id,
          dateFrom,
          dateTo: dateTo.toISOString().split('T')[0],
        })
        setExceptions(exceptionsData)
        
        // Load consolidated data
        const consolidatedData = await ScheduleExceptionService.getConsolidated({
          businessId: businessData.id,
          dateFrom,
          dateTo: dateTo.toISOString().split('T')[0],
        })
        setConsolidatedGroups(consolidatedData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateException = () => {
    setDialogOpen(true)
  }

  const handleExceptionCreated = () => {
    setDialogOpen(false)
    loadData()
    toast.success('Ausnahme erfolgreich erstellt')
  }

  const handleDeleteException = async (id: string) => {
    try {
      await ScheduleExceptionService.delete(id)
      toast.success('Ausnahme erfolgreich gelöscht')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Löschen der Ausnahme')
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => ScheduleExceptionService.delete(id)))
      toast.success(`${ids.length} Ausnahmen erfolgreich gelöscht`)
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Löschen der Ausnahmen')
    }
  }


  // Filter logic for both views
  const applyFilters = () => {
    // Filter exceptions
    const filteredExceptions = exceptions.filter(exception => {
      if (filterEmployee !== 'all' && exception.employeeId !== filterEmployee) {
        return false
      }
      if (filterType !== 'all' && exception.type !== filterType) {
        return false
      }
      if (filterMonth !== 'all') {
        const exceptionDate = new Date(exception.date)
        const [year, month] = filterMonth.split('-').map(Number)
        const monthStart = startOfMonth(new Date(year, month - 1))
        const monthEnd = endOfMonth(new Date(year, month - 1))
        if (exceptionDate < monthStart || exceptionDate > monthEnd) {
          return false
        }
      }
      return true
    })

    // Filter consolidated groups
    const filteredGroups = consolidatedGroups.filter(group => {
      if (filterEmployee !== 'all' && !group.employeeIds.includes(filterEmployee)) {
        return false
      }
      if (filterType !== 'all' && group.type !== filterType) {
        return false
      }
      if (filterMonth !== 'all') {
        const groupDate = new Date(group.date)
        const [year, month] = filterMonth.split('-').map(Number)
        const monthStart = startOfMonth(new Date(year, month - 1))
        const monthEnd = endOfMonth(new Date(year, month - 1))
        if (groupDate < monthStart || groupDate > monthEnd) {
          return false
        }
      }
      return true
    })

    return { filteredExceptions, filteredGroups }
  }

  const { filteredExceptions, filteredGroups } = applyFilters()

  // Group exceptions by month for timeline view
  const groupedExceptions = filteredExceptions.reduce((groups, exception) => {
    const month = format(new Date(exception.date), 'yyyy-MM')
    if (!groups[month]) {
      groups[month] = []
    }
    groups[month].push(exception)
    return groups
  }, {} as Record<string, ScheduleExceptionWithRelations[]>)

  // Generate month options for filter
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = addMonths(new Date(), i)
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: de }),
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2">
            <Link
              href="/schedules"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zu Zeitpläne
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Zeitplan-Ausnahmen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Urlaubstage, Feiertage und andere Ausnahmen
          </p>
        </div>
        <Button onClick={() => handleCreateException()}>
          <Plus className="mr-2 h-4 w-4" />
          Abwesenheit hinzufügen
        </Button>
      </div>


      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Filter</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterEmployee('all')
                  setFilterType('all')
                  setFilterMonth('all')
                }}
              >
                Zurücksetzen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mitarbeiter</label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Typ</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="unavailable">Abwesenheit</SelectItem>
                  <SelectItem value="modified_hours">Geänderte Zeiten</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Monat</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Monate</SelectItem>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Ausnahmen</h2>
            <Badge variant="outline">
              {viewMode === 'consolidated' 
                ? `${filteredGroups.length} Gruppen` 
                : `${filteredExceptions.length} Ergebnisse`}
            </Badge>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="consolidated">
                <LayersIcon className="h-4 w-4 mr-1" />
                Konsolidiert
              </TabsTrigger>
              <TabsTrigger value="list">Liste</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {viewMode === 'consolidated' ? (
          <ScheduleExceptionTableConsolidated
            groups={filteredGroups}
            onDelete={handleBulkDelete}
            onBulkDelete={handleBulkDelete}
          />
        ) : viewMode === 'list' ? (
          <ScheduleExceptionTable
            exceptions={filteredExceptions}
            employees={employees}
            onDelete={handleDeleteException}
            onBulkDelete={handleBulkDelete}
            onCreateException={handleCreateException}
          />
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedExceptions)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([month, monthExceptions]) => {
                const [year, monthNum] = month.split('-').map(Number)
                const monthDate = new Date(year, monthNum - 1)
                
                return (
                  <Card key={month}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {format(monthDate, 'MMMM yyyy', { locale: de })}
                      </CardTitle>
                      <CardDescription>
                        {monthExceptions.length} Ausnahmen
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScheduleExceptionTable
                        exceptions={monthExceptions}
                        employees={employees}
                        onDelete={handleDeleteException}
                        onBulkDelete={handleBulkDelete}
                        onCreateException={handleCreateException}
                        compact
                      />
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )}
      </div>

      <ScheduleExceptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employees={employees}
        onSuccess={handleExceptionCreated}
      />
    </div>
  )
}