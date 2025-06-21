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
import { Textarea } from '@/src/components/ui/textarea'
import { ScheduleExceptionService } from '@/src/lib/services/schedule-exception.service'
import { 
  createBusinessHolidaySchema,
  type CreateBusinessHolidayInput,
  EXCEPTION_REASONS,
  type ExceptionReason
} from '@/src/lib/schemas/schedule-exception'
import { toast } from 'sonner'
import { Loader2, Calendar, Users, AlertCircle } from 'lucide-react'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Label } from '@/src/components/ui/label'

interface ScheduleExceptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: any[]
  onSuccess: () => void
}

export function ScheduleExceptionDialog({
  open,
  onOpenChange,
  employees,
  onSuccess,
}: ScheduleExceptionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(employees.map(e => e.id))

  const form = useForm<CreateBusinessHolidayInput>({
    resolver: zodResolver(createBusinessHolidaySchema),
    defaultValues: {
      dateFrom: '',
      dateTo: undefined,
      reasonType: 'Betriebsferien',
      reasonDetails: '',
      employeeIds: employees.map(e => e.id),
    },
  })

  const watchReasonType = form.watch('reasonType')

  React.useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      form.reset({
        dateFrom: '',
        dateTo: undefined,
        reasonType: 'Betriebsferien',
        reasonDetails: '',
        employeeIds: employees.map(e => e.id),
      })
      setSelectedEmployees(employees.map(e => e.id))
    }
  }, [open, employees, form])

  React.useEffect(() => {
    form.setValue('employeeIds', selectedEmployees)
  }, [selectedEmployees, form])

  const handleSubmit = async (data: CreateBusinessHolidayInput) => {
    try {
      setLoading(true)
      
      // Determine the actual reason text
      const reason = data.reasonType === 'Sonstiges' 
        ? data.reasonDetails || 'Sonstiges'
        : data.reasonType
      
      // Calculate date range
      const startDate = new Date(data.dateFrom)
      const endDate = data.dateTo ? new Date(data.dateTo) : startDate
      
      // Create exceptions for each employee and each date in the range
      const promises = []
      
      for (const employeeId of data.employeeIds) {
        const currentDate = new Date(startDate)
        
        while (currentDate <= endDate) {
          promises.push(
            ScheduleExceptionService.create({
              employeeId,
              date: format(currentDate, 'yyyy-MM-dd'),
              type: 'unavailable',
              reason,
            })
          )
          
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
      
      await Promise.all(promises)
      
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const message = days === 1
        ? `${data.employeeIds.length} Ausnahme(n) für ${format(startDate, 'd. MMMM yyyy', { locale: de })} erstellt`
        : `${data.employeeIds.length * days} Ausnahmen für ${days} Tage erstellt`
      
      toast.success(message)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Erstellen der Ausnahmen')
    } finally {
      setLoading(false)
    }
  }

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId)
      } else {
        return [...prev, employeeId]
      }
    })
  }

  const toggleAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(employees.map(e => e.id))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Abwesenheit hinzufügen</DialogTitle>
          <DialogDescription>
            Fügen Sie Betriebsferien, Feiertage oder andere Ausnahmen für Ihre Mitarbeiter hinzu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Von *</FormLabel>
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
                control={form.control}
                name="dateTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bis (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                        min={form.getValues('dateFrom') || format(new Date(), 'yyyy-MM-dd')}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Leer lassen für einzelnen Tag
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reason */}
            <FormField
              control={form.control}
              name="reasonType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grund *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(EXCEPTION_REASONS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason Details for "Sonstiges" */}
            {watchReasonType === 'Sonstiges' && (
              <FormField
                control={form.control}
                name="reasonDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Bitte geben Sie Details an..."
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Employee Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Mitarbeiter *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllEmployees}
                >
                  {selectedEmployees.length === employees.length ? 'Alle abwählen' : 'Alle auswählen'}
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`employee-${employee.id}`}
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                    />
                    <Label
                      htmlFor={`employee-${employee.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
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
              
              {selectedEmployees.length === 0 && (
                <p className="text-sm text-destructive">
                  Mindestens ein Mitarbeiter muss ausgewählt werden
                </p>
              )}
              
              <p className="text-sm text-muted-foreground">
                {selectedEmployees.length} von {employees.length} Mitarbeitern ausgewählt
              </p>
            </div>

            {/* Summary Alert */}
            {form.getValues('dateFrom') && selectedEmployees.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Diese Aktion erstellt {
                    form.getValues('dateTo') 
                      ? `Ausnahmen für ${selectedEmployees.length} Mitarbeiter über mehrere Tage`
                      : `${selectedEmployees.length} Ausnahme(n) für ${format(new Date(form.getValues('dateFrom')), 'd. MMMM yyyy', { locale: de })}`
                  }
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
              <Button type="submit" disabled={loading || selectedEmployees.length === 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ausnahmen erstellen
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}