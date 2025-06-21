import { createClient } from '../supabase/server'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns'

export interface ServiceStatistics {
  serviceId: string
  serviceName: string
  bookingCount: number
  totalRevenue: number
  averagePrice: number
  completionRate: number
}

export interface EmployeeStatistics {
  employeeId: string
  employeeName: string
  appointmentCount: number
  completedCount: number
  cancelledCount: number
  totalRevenue: number
  utilizationRate: number
  averageRating?: number
}

export interface CustomerStatistics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  retentionRate: number
  averageBookingValue: number
  topCustomers: Array<{
    customerId: string
    customerName: string
    appointmentCount: number
    totalSpent: number
  }>
}

export interface RevenueComparison {
  todayRevenue: number
  yesterdayRevenue: number
  weekRevenue: number
  lastWeekRevenue: number
  monthRevenue: number
  lastMonthRevenue: number
  yearRevenue: number
  lastYearRevenue: number
}

export interface TimeAnalytics {
  busiestDays: Array<{
    dayOfWeek: number
    dayName: string
    appointmentCount: number
  }>
  busiestHours: Array<{
    hour: number
    appointmentCount: number
  }>
  averageDuration: number
  totalDuration: number
}

export class ReportService {
  private static async getClient() {
    return createClient()
  }

  // Get comprehensive revenue comparison data
  static async getRevenueComparison(businessId: string): Promise<RevenueComparison> {
    const supabase = await this.getClient()
    
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = subDays(todayStart, 1)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const lastWeekStart = subWeeks(weekStart, 1)
    const monthStart = startOfMonth(now)
    const lastMonthStart = subMonths(monthStart, 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)

    // Helper function to get revenue for a date range
    const getRevenue = async (startDate: Date, endDate: Date) => {
      const { data } = await supabase
        .from('Appointment')
        .select('*, Service(price)')
        .eq('businessId', businessId)
        .gte('startTime', startDate.toISOString())
        .lt('endTime', endDate.toISOString())
        .in('status', ['completed', 'confirmed'])

      return data?.reduce((sum: number, apt: any) => sum + (apt.Service?.price || 0), 0) || 0
    }

    // Get all revenue data in parallel
    const [
      todayRevenue,
      yesterdayRevenue,
      weekRevenue,
      lastWeekRevenue,
      monthRevenue,
      lastMonthRevenue,
      yearRevenue,
      lastYearRevenue
    ] = await Promise.all([
      getRevenue(todayStart, new Date()),
      getRevenue(yesterdayStart, todayStart),
      getRevenue(weekStart, new Date()),
      getRevenue(lastWeekStart, weekStart),
      getRevenue(monthStart, new Date()),
      getRevenue(lastMonthStart, monthStart),
      getRevenue(yearStart, new Date()),
      getRevenue(lastYearStart, yearStart)
    ])

    return {
      todayRevenue,
      yesterdayRevenue,
      weekRevenue,
      lastWeekRevenue,
      monthRevenue,
      lastMonthRevenue,
      yearRevenue,
      lastYearRevenue
    }
  }

  // Get service statistics
  static async getServiceStatistics(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceStatistics[]> {
    const supabase = await this.getClient()

    // Get all appointments with service data in the date range
    const { data: appointments, error } = await supabase
      .from('Appointment')
      .select(`
        id,
        status,
        Service(id, name, price)
      `)
      .eq('businessId', businessId)
      .gte('startTime', startDate.toISOString())
      .lt('endTime', endDate.toISOString())

    if (error || !appointments) {
      console.error('Error fetching service statistics:', error)
      return []
    }

    // Group by service
    const serviceMap = new Map<string, ServiceStatistics>()

    appointments.forEach((apt: any) => {
      if (!apt.Service) return

      const serviceId = apt.Service.id
      const existing = serviceMap.get(serviceId) || {
        serviceId,
        serviceName: apt.Service.name,
        bookingCount: 0,
        totalRevenue: 0,
        averagePrice: apt.Service.price,
        completionRate: 0
      }

      existing.bookingCount++
      if (apt.status === 'completed' || apt.status === 'confirmed') {
        existing.totalRevenue += apt.Service.price
      }

      serviceMap.set(serviceId, existing)
    })

    // Calculate completion rates
    serviceMap.forEach(stats => {
      const completedCount = appointments.filter(
        (apt: any) => apt.Service?.id === stats.serviceId && 
        (apt.status === 'completed' || apt.status === 'confirmed')
      ).length
      
      stats.completionRate = stats.bookingCount > 0 
        ? Math.round((completedCount / stats.bookingCount) * 100)
        : 0
    })

    return Array.from(serviceMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
  }

  // Get employee statistics
  static async getEmployeeStatistics(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EmployeeStatistics[]> {
    const supabase = await this.getClient()

    // Get all appointments with employee and service data
    const { data: appointments, error } = await supabase
      .from('Appointment')
      .select(`
        id,
        status,
        Employee(id, name),
        Service(price)
      `)
      .eq('businessId', businessId)
      .gte('startTime', startDate.toISOString())
      .lt('endTime', endDate.toISOString())

    if (error || !appointments) {
      console.error('Error fetching employee statistics:', error)
      return []
    }

    // Get employee working hours for utilization calculation
    const { data: employees } = await supabase
      .from('Employee')
      .select('id, name, workingHours')
      .eq('businessId', businessId)

    // Group by employee
    const employeeMap = new Map<string, EmployeeStatistics>()

    appointments.forEach((apt: any) => {
      if (!apt.Employee) return

      const employeeId = apt.Employee.id
      const existing = employeeMap.get(employeeId) || {
        employeeId,
        employeeName: apt.Employee.name,
        appointmentCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        totalRevenue: 0,
        utilizationRate: 0
      }

      existing.appointmentCount++
      
      if (apt.status === 'completed') {
        existing.completedCount++
        existing.totalRevenue += apt.Service?.price || 0
      } else if (apt.status === 'confirmed') {
        existing.totalRevenue += apt.Service?.price || 0
      } else if (apt.status === 'cancelled') {
        existing.cancelledCount++
      }

      employeeMap.set(employeeId, existing)
    })

    // Calculate utilization rates
    const workDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const hoursPerDay = 8 // Default assumption

    employeeMap.forEach(stats => {
      const employee = employees?.find((e: any) => e.id === stats.employeeId)
      if (employee?.workingHours) {
        // TODO: Calculate actual working hours from schedule
        const totalAvailableHours = workDays * hoursPerDay
        const bookedHours = stats.appointmentCount * 1 // Assume 1 hour average
        stats.utilizationRate = Math.round((bookedHours / totalAvailableHours) * 100)
      }
    })

    return Array.from(employeeMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
  }

  // Get customer statistics
  static async getCustomerStatistics(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CustomerStatistics> {
    const supabase = await this.getClient()

    // Get all appointments with customer data
    const { data: appointments, error } = await supabase
      .from('Appointment')
      .select(`
        id,
        status,
        Customer(id, name, createdAt),
        Service(price)
      `)
      .eq('businessId', businessId)
      .gte('startTime', startDate.toISOString())
      .lt('endTime', endDate.toISOString())
      .in('status', ['completed', 'confirmed'])

    if (error || !appointments) {
      console.error('Error fetching customer statistics:', error)
      return {
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        retentionRate: 0,
        averageBookingValue: 0,
        topCustomers: []
      }
    }

    // Get unique customers
    const customerMap = new Map<string, {
      customerId: string
      customerName: string
      appointmentCount: number
      totalSpent: number
      isNew: boolean
    }>()

    appointments.forEach((apt: any) => {
      if (!apt.Customer) return

      const customerId = apt.Customer.id
      const existing = customerMap.get(customerId) || {
        customerId,
        customerName: apt.Customer.name,
        appointmentCount: 0,
        totalSpent: 0,
        isNew: new Date(apt.Customer.createdAt) >= startDate
      }

      existing.appointmentCount++
      existing.totalSpent += apt.Service?.price || 0

      customerMap.set(customerId, existing)
    })

    const customers = Array.from(customerMap.values())
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)

    // Get retention data
    const { data: previousCustomers } = await supabase
      .from('Appointment')
      .select('Customer(id)')
      .eq('businessId', businessId)
      .lt('startTime', startDate.toISOString())
      .in('status', ['completed'])

    const previousCustomerIds = new Set(previousCustomers?.map((a: any) => a.Customer?.id).filter(Boolean))
    const returningCustomers = customers.filter(c => previousCustomerIds.has(c.customerId))

    return {
      totalCustomers: customers.length,
      newCustomers: customers.filter(c => c.isNew).length,
      returningCustomers: returningCustomers.length,
      retentionRate: customers.length > 0 
        ? Math.round((returningCustomers.length / customers.length) * 100)
        : 0,
      averageBookingValue: customers.length > 0 
        ? Math.round((totalRevenue / appointments.length) * 100) / 100
        : 0,
      topCustomers: customers
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
    }
  }

  // Get time-based analytics
  static async getTimeAnalytics(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeAnalytics> {
    const supabase = await this.getClient()

    const { data: appointments, error } = await supabase
      .from('Appointment')
      .select(`
        startTime,
        endTime,
        Service(duration)
      `)
      .eq('businessId', businessId)
      .gte('startTime', startDate.toISOString())
      .lt('endTime', endDate.toISOString())
      .in('status', ['completed', 'confirmed'])

    if (error || !appointments) {
      console.error('Error fetching time analytics:', error)
      return {
        busiestDays: [],
        busiestHours: [],
        averageDuration: 0,
        totalDuration: 0
      }
    }

    // Analyze by day of week
    const dayMap = new Map<number, number>()
    const hourMap = new Map<number, number>()
    let totalDuration = 0

    appointments.forEach((apt: any) => {
      const date = new Date(apt.startTime)
      const dayOfWeek = date.getDay()
      const hour = date.getHours()

      dayMap.set(dayOfWeek, (dayMap.get(dayOfWeek) || 0) + 1)
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)

      // Calculate duration
      if (apt.Service?.duration) {
        totalDuration += apt.Service.duration
      }
    })

    const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
    const busiestDays = Array.from(dayMap.entries())
      .map(([day, count]) => ({
        dayOfWeek: day,
        dayName: dayNames[day],
        appointmentCount: count
      }))
      .sort((a, b) => b.appointmentCount - a.appointmentCount)

    const busiestHours = Array.from(hourMap.entries())
      .map(([hour, count]) => ({
        hour,
        appointmentCount: count
      }))
      .sort((a, b) => b.appointmentCount - a.appointmentCount)

    return {
      busiestDays,
      busiestHours,
      averageDuration: appointments.length > 0 
        ? Math.round(totalDuration / appointments.length)
        : 0,
      totalDuration
    }
  }

  // Export appointments data as CSV
  static async exportAppointmentsCSV(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const supabase = await this.getClient()

    const { data: appointments, error } = await supabase
      .from('Appointment')
      .select(`
        startTime,
        endTime,
        status,
        Customer(name, email, phone),
        Employee(name),
        Service(name, price)
      `)
      .eq('businessId', businessId)
      .gte('startTime', startDate.toISOString())
      .lt('endTime', endDate.toISOString())
      .order('startTime', { ascending: true })

    if (error || !appointments) {
      throw new Error('Fehler beim Exportieren der Daten')
    }

    // Create CSV header
    const headers = [
      'Datum',
      'Startzeit',
      'Endzeit',
      'Status',
      'Kunde',
      'Email',
      'Telefon',
      'Mitarbeiter',
      'Service',
      'Preis'
    ]

    // Create CSV rows
    const rows = appointments.map((apt: any) => {
      const date = new Date(apt.startTime)
      return [
        format(date, 'dd.MM.yyyy'),
        format(date, 'HH:mm'),
        format(new Date(apt.endTime), 'HH:mm'),
        apt.status,
        apt.Customer?.name || '',
        apt.Customer?.email || '',
        apt.Customer?.phone || '',
        apt.Employee?.name || '',
        apt.Service?.name || '',
        apt.Service?.price || 0
      ]
    })

    // Combine headers and rows
    const csv = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n')

    return csv
  }
}