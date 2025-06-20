'use client'

import { useState } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/src/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { ScheduleExceptionService } from '@/src/lib/services/schedule-exception.service'
import { 
  createScheduleExceptionSchema,
  createScheduleExceptionRangeSchema,
  type CreateScheduleExceptionInput,
  type CreateScheduleExceptionRangeInput
} from '@/src/lib/schemas/schedule-exception'
import { toast } from 'sonner'
import { Loader2, Calendar, Users, AlertCircle } from 'lucide-react'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { BusinessService } from '@/src/lib/services/business.service'
import { z } from 'zod'

interface ScheduleExceptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: any[]
  initialEmployeeId?: string | null
  isHolidayMode?: boolean
  onSuccess: () => void
}

// Schema for business-wide holiday
const createBusinessHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  dateRangeEnd: z.string().optional().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
    'Ungültiges Datumsformat'
  ),
  reason: z.string().min(1, 'Grund ist erforderlich'),
  employeeIds: z.array(z.string()).min(1, 'Mindestens ein Mitarbeiter muss ausgewählt werden'),
})

type CreateBusinessHolidayInput = z.infer<typeof createBusinessHolidaySchema>

// Common holiday reasons
const COMMON_HOLIDAYS = [
  'Weihnachten',
  'Neujahr',
  'Ostern',
  'Pfingsten',
  'Betriebsferien',
  'Nationalfeiertag',
  'Inventur',
]

export function ScheduleExceptionDialog({
  open,
  onOpenChange,
  employees,
  initialEmployeeId,
  isHolidayMode = false,
  onSuccess,
}: ScheduleExceptionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'single' | 'range' | 'holiday'>(
    isHolidayMode ? 'holiday' : 'single'
  )
  const [exceptionType, setExceptionType] = useState<'unavailable' | 'modified_hours'>('unavailable')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(employees.map(e => e.id))
  const [business, setBusiness] = useState<any>(null)

  // Load business data when dialog opens
  React.useEffect(() => {
    if (open) {
      // Reset active tab based on mode
      setActiveTab(isHolidayMode ? 'holiday' : 'single')
      
      if (isHolidayMode) {
        BusinessService.getCurrentBusiness().then(setBusiness)
      }
    }
  }, [open, isHolidayMode])

  // Reset selected employees when employees prop changes
  React.useEffect(() => {
    if (isHolidayMode) {
      setSelectedEmployees(employees.map(e => e.id))
    }
  }, [employees, isHolidayMode])

  // Single day form
  const singleForm = useForm<CreateScheduleExceptionInput>({
    resolver: zodResolver(createScheduleExceptionSchema),
    defaultValues: {
      employeeId: initialEmployeeId || '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'unavailable',
      reason: '',
      startTime: '',
      endTime: '',
    },
  })

  // Date range form
  const rangeForm = useForm<CreateScheduleExceptionRangeInput>({
    resolver: zodResolver(createScheduleExceptionRangeSchema),
    defaultValues: {
      employeeId: initialEmployeeId || '',
      dateFrom: format(new Date(), 'yyyy-MM-dd'),
      dateTo: format(new Date(), 'yyyy-MM-dd'),
      type: 'unavailable',
      reason: '',
    },
  })

  // Business holiday form
  const holidayForm = useForm<CreateBusinessHolidayInput>({
    resolver: zodResolver(createBusinessHolidaySchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      dateRangeEnd: '',
      reason: '',
      employeeIds: employees.map(e => e.id),
    },
  })

  // Watch for type changes and update form
  React.useEffect(() => {
    const subscription = singleForm.watch((value, { name }) => {
      if (name === 'type' && value.type) {
        setExceptionType(value.type as 'unavailable' | 'modified_hours')
      }
    })
    return () => subscription.unsubscribe()
  }, [singleForm])

  const handleSingleSubmit = async (data: CreateScheduleExceptionInput) => {
    try {
      setLoading(true)
      await ScheduleExceptionService.create(data)
      toast.success('Ausnahme erfolgreich erstellt')
      onSuccess()
      singleForm.reset()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Erstellen der Ausnahme')
    } finally {
      setLoading(false)
    }
  }

  const handleRangeSubmit = async (data: CreateScheduleExceptionRangeInput) => {
    try {
      setLoading(true)
      await ScheduleExceptionService.createRange(data)
      toast.success('Ausnahmen erfolgreich erstellt')
      onSuccess()
      rangeForm.reset()
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Erstellen der Ausnahmen')
    } finally {
      setLoading(false)
    }
  }

  const handleHolidaySubmit = async (data: CreateBusinessHolidayInput) => {
    try {
      setLoading(true)
      
      if (!business) {
        throw new Error('Business-Daten nicht geladen')
      }

      const result = await ScheduleExceptionService.createForAllEmployees({
        businessId: business.id,
        date: data.date,
        dateRangeEnd: data.dateRangeEnd || undefined,
        type: 'holiday',
        reason: data.reason,
        employeeIds: selectedEmployees,
      })
      
      if (result.created > 0) {
        toast.success(
          `Feiertag erfolgreich erstellt: ${result.created} Ausnahmen für ${result.employees.length} Mitarbeiter`
        )
      }
      
      if (result.skipped > 0) {
        toast.info(`${result.skipped} Ausnahmen wurden übersprungen (bereits vorhanden)`)
      }
      
      onSuccess()
      holidayForm.reset()
      setSelectedEmployees(employees.map(e => e.id))
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Erstellen des Feiertags')
    } finally {
      setLoading(false)
    }
  }

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const toggleAllEmployees = () => {
    setSelectedEmployees(prev =>
      prev.length === employees.length ? [] : employees.map(e => e.id)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isHolidayMode 
              ? 'Feiertag für alle Mitarbeiter' 
              : 'Zeitplan-Ausnahme erstellen'}
          </DialogTitle>
          <DialogDescription>
            {isHolidayMode
              ? 'Erstellen Sie einen Feiertag oder Betriebsurlaub für mehrere Mitarbeiter gleichzeitig'
              : 'Definieren Sie Urlaubstage, geänderte Arbeitszeiten oder andere Ausnahmen'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          {isHolidayMode ? (
            // Holiday mode - no tabs needed, just show the holiday form
            <></>
          ) : (
            // Regular mode - show single/range tabs
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Einzelner Tag</TabsTrigger>
              <TabsTrigger value="range">Zeitraum</TabsTrigger>
            </TabsList>
          )}

          {!isHolidayMode && (
            <TabsContent value="single" className="space-y-4">
              <Form {...singleForm}>
                <form onSubmit={singleForm.handleSubmit(handleSingleSubmit)} className="space-y-4">
                <FormField
                  control={singleForm.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mitarbeiter</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Mitarbeiter auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={singleForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={singleForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Art der Ausnahme</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unavailable">Abwesend (Urlaub, Krankheit)</SelectItem>
                          <SelectItem value="modified_hours">Geänderte Arbeitszeiten</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {singleForm.watch('type') === 'modified_hours' && (
                  <>
                    <FormField
                      control={singleForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Arbeitszeit von</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={singleForm.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Arbeitszeit bis</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={singleForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grund (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="z.B. Urlaub, Krankheit, Fortbildung..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Erstellen
                  </Button>
                </div>
              </form>
            </Form>
            </TabsContent>
          )}

          {!isHolidayMode && (
            <TabsContent value="range" className="space-y-4">
              <Form {...rangeForm}>
              <form onSubmit={rangeForm.handleSubmit(handleRangeSubmit)} className="space-y-4">
                <FormField
                  control={rangeForm.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mitarbeiter</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Mitarbeiter auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={rangeForm.control}
                    name="dateFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Von</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            min={format(new Date(), 'yyyy-MM-dd')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={rangeForm.control}
                    name="dateTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bis</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            min={rangeForm.watch('dateFrom')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={rangeForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grund (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="z.B. Urlaub, Krankheit, Fortbildung..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormDescription>
                  <Calendar className="inline-block w-4 h-4 mr-1" />
                  Erstellt eine Abwesenheit für jeden Tag im gewählten Zeitraum
                </FormDescription>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Erstellen
                  </Button>
                </div>
              </form>
            </Form>
            </TabsContent>
          )}

          {isHolidayMode && (
            <TabsContent value="holiday" className="space-y-4">
              <Form {...holidayForm}>
              <form onSubmit={holidayForm.handleSubmit(handleHolidaySubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={holidayForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datum / Von</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            min={format(new Date(), 'yyyy-MM-dd')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={holidayForm.control}
                    name="dateRangeEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bis (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            min={holidayForm.watch('date')}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Leer lassen für einzelnen Tag
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={holidayForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grund</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          if (value === 'custom') {
                            field.onChange('')
                          } else {
                            field.onChange(value)
                          }
                        }} 
                        value={COMMON_HOLIDAYS.includes(field.value) ? field.value : 'custom'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Grund auswählen oder eingeben" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMMON_HOLIDAYS.map((holiday) => (
                            <SelectItem key={holiday} value={holiday}>
                              {holiday}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Anderer Grund...</SelectItem>
                        </SelectContent>
                      </Select>
                      {!COMMON_HOLIDAYS.includes(field.value) && (
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Grund eingeben..."
                            className="mt-2"
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Betroffene Mitarbeiter</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleAllEmployees}
                    >
                      {selectedEmployees.length === employees.length ? 'Alle abwählen' : 'Alle auswählen'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={() => toggleEmployee(employee.id)}
                        />
                        <label
                          htmlFor={`employee-${employee.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {employee.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  {selectedEmployees.length === 0 && (
                    <p className="text-sm text-destructive">
                      Mindestens ein Mitarbeiter muss ausgewählt werden
                    </p>
                  )}
                </div>

                {selectedEmployees.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Dies erstellt Ausnahmen für {selectedEmployees.length} Mitarbeiter.
                      Bereits vorhandene Ausnahmen werden übersprungen.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || selectedEmployees.length === 0}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Feiertag erstellen
                  </Button>
                </div>
              </form>
            </Form>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}