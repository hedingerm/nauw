import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BusinessService } from '@/src/lib/services/business.service'
import { ServiceService, type ServicesGroupedByCategory } from '@/src/lib/services/service.service'
import { EmployeeService } from '@/src/lib/services/employee.service'
import { BookingPageConfigService } from '@/src/lib/services/booking-config.service'
import type { Database } from '@/src/lib/supabase/database.types'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'

type Business = Database['public']['Tables']['Business']['Row']
type Employee = Database['public']['Tables']['Employee']['Row'] & {
  serviceIds: string[]
}

interface UseBookingDataReturn {
  business: Business | null
  businessId: string | null
  serviceGroups: ServicesGroupedByCategory[]
  employees: Employee[]
  config: BookingPageConfig | null
  loading: boolean
  error: string | null
}

export function useBookingData(urlSlug: string): UseBookingDataReturn {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [serviceGroups, setServiceGroups] = useState<ServicesGroupedByCategory[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [config, setConfig] = useState<BookingPageConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load business details by URL slug
        const businessData = await BusinessService.getBySlug(urlSlug)
        if (!businessData) {
          setError('Unternehmen nicht gefunden')
          toast.error('Unternehmen nicht gefunden')
          router.push('/')
          return
        }
        setBusiness(businessData)
        setBusinessId(businessData.id)

        // Load services, employees, and config in parallel
        const [serviceGroupsData, employeesData, configData] = await Promise.all([
          ServiceService.listActiveGroupedByCategory(businessData.id),
          EmployeeService.listActive(businessData.id),
          BookingPageConfigService.getOrCreate(businessData.id)
        ])

        setServiceGroups(serviceGroupsData)
        setEmployees(employeesData)
        setConfig(configData)
      } catch (error) {
        console.error('Error loading business data:', error)
        setError('Fehler beim Laden der Daten')
        toast.error('Fehler beim Laden der Daten')
      } finally {
        setLoading(false)
      }
    }

    if (urlSlug) {
      loadBusinessData()
    }
  }, [urlSlug, router])

  return {
    business,
    businessId,
    serviceGroups,
    employees,
    config,
    loading,
    error
  }
}