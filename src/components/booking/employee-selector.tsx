'use client'

import { Card, CardContent } from '@/src/components/ui/card'
import { Label } from '@/src/components/ui/label'
import { Check } from 'lucide-react'
import type { Database } from '@/src/lib/supabase/database.types'

type Employee = Database['public']['Tables']['Employee']['Row'] & {
  serviceIds: string[]
}

interface TimeSlot {
  time: string
  available: boolean
  employeeId?: string
  employeeName?: string
  availableEmployeeCount?: number
  availableEmployees?: Array<{ id: string; name: string }>
}

interface EmployeeSelectorProps {
  employees: Employee[]
  selectedEmployee: Employee | null
  selectedTime: string | null
  availableSlots: TimeSlot[]
  showEmployeeSelection?: boolean
  onEmployeeSelect: (employee: Employee) => void
}

export function EmployeeSelector({
  employees,
  selectedEmployee,
  selectedTime,
  availableSlots,
  showEmployeeSelection = true,
  onEmployeeSelect
}: EmployeeSelectorProps) {
  if (!selectedTime || !showEmployeeSelection) {
    return null
  }

  const selectedSlot = availableSlots.find(s => s.time === selectedTime && s.available)
  const availableEmps = selectedSlot?.availableEmployees || []
  
  // If only one employee is available, don't show the selector
  if (availableEmps.length <= 1) {
    return null
  }

  return (
    <div className="mt-6 pt-6 border-t">
      <Label>Mitarbeiter auswählen</Label>
      <p className="text-sm text-muted-foreground mb-3">
        {availableEmps.length} Mitarbeiter sind um {selectedTime} Uhr verfügbar
      </p>
      <div className="grid gap-3">
        {availableEmps.map((emp) => {
          const employee = employees.find(e => e.id === emp.id)
          if (!employee) return null
          
          return (
            <Card 
              key={employee.id} 
              className={`cursor-pointer transition-all ${
                selectedEmployee?.id === employee.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onEmployeeSelect(employee)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{employee.name}</span>
                  {selectedEmployee?.id === employee.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}