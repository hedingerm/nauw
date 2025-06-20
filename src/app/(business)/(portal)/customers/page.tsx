'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BusinessService } from '@/src/lib/services/business.service'
import { CustomerService } from '@/src/lib/services/customer.service'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { 
  Search, 
  Plus, 
  Users, 
  UserCheck, 
  TrendingUp,
  Star,
  Filter,
  Download,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Euro
} from 'lucide-react'
import { formatDate } from '@/src/lib/utils/date'
import { formatCurrency } from '@/src/lib/utils/format'
import { formatPhoneForDisplay } from '@/src/lib/utils/normalize'
import type { CustomerWithRelations } from '@/src/lib/schemas/customer'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'

export default function CustomersPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<any>(null)
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'lastAppointment'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterVip, setFilterVip] = useState<boolean | null>(null)
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Stats
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newThisMonth: 0,
    vipCustomers: 0,
    activeCustomers: 0,
  })

  useEffect(() => {
    loadBusiness()
  }, [])

  useEffect(() => {
    if (business) {
      loadCustomers()
    }
  }, [business, sortBy, sortOrder, filterVip, filterActive, page])

  const loadBusiness = async () => {
    try {
      const businessData = await BusinessService.getCurrentBusiness()
      setBusiness(businessData)
    } catch (error) {
      console.error('Error loading business:', error)
      toast.error('Fehler beim Laden der Geschäftsdaten')
    }
  }

  const loadCustomers = async () => {
    if (!business) return

    try {
      setLoading(true)
      const result = await CustomerService.list({
        businessId: business.id,
        isActive: filterActive === null ? undefined : filterActive,
        vipStatus: filterVip === null ? undefined : filterVip,
        sortBy,
        sortOrder,
        page,
        limit: 20,
      })

      setCustomers(result.customers)
      setTotal(result.total)
      setTotalPages(result.totalPages)

      // Calculate stats
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const newThisMonth = result.customers.filter(c => {
        const createdDate = new Date(c.createdAt)
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
      }).length

      const vipCount = result.customers.filter(c => c.vipStatus).length
      const activeCount = result.customers.filter(c => c.isActive).length

      setStats({
        totalCustomers: result.total,
        newThisMonth,
        vipCustomers: vipCount,
        activeCustomers: activeCount,
      })
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('Fehler beim Laden der Kundendaten')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!business) {
      if (searchQuery.length === 0) {
        // If search is cleared, reload with filters
        loadCustomers()
      }
      return
    }

    if (searchQuery.length < 2) {
      // If search query is too short, reload with filters
      loadCustomers()
      return
    }

    try {
      setLoading(true)
      const results = await CustomerService.search({
        businessId: business.id,
        query: searchQuery,
        limit: 20,
      })
      
      // Convert search results to CustomerWithRelations format
      const customersWithRelations: CustomerWithRelations[] = results.map(r => ({
        ...r,
        businessId: business.id,
        notes: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        appointmentCount: r.visitCount || 0,
        lastAppointmentDate: r.lastVisit,
        vipStatus: false,
        address: null,
        birthday: null,
        city: null,
        gender: null,
        lastContactedAt: null,
        marketingConsent: null,
        postalCode: null,
        preferredContactMethod: null,
        source: null,
        tags: null,
      }))
      
      setCustomers(customersWithRelations)
      setTotal(results.length)
      setTotalPages(1)
    } catch (error) {
      console.error('Error searching customers:', error)
      toast.error('Fehler bei der Kundensuche')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    toast.info('Export-Funktion wird in Kürze verfügbar sein')
  }

  const handleCustomerClick = (customerId: string) => {
    router.push(`/customers/${customerId}`)
  }

  const handleNewCustomer = () => {
    router.push('/customers/new')
  }

  const toggleCustomerStatus = async (customerId: string) => {
    try {
      await CustomerService.toggleActive(customerId)
      toast.success('Kundenstatus erfolgreich geändert')
      loadCustomers()
    } catch (error) {
      console.error('Error toggling customer status:', error)
      toast.error('Fehler beim Ändern des Kundenstatus')
    }
  }

  if (loading && !customers.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">Kundendaten werden geladen...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kunden</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Kunden und deren Informationen
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtkunden</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neu diesen Monat</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP-Kunden</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vipCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Kunden</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kundenliste</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportieren
              </Button>
              <Button size="sm" onClick={handleNewCustomer}>
                <Plus className="mr-2 h-4 w-4" />
                Neuer Kunde
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suche nach Name, E-Mail oder Telefon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>Suchen</Button>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('')
                    loadCustomers()
                  }}
                >
                  Zurücksetzen
                </Button>
              )}
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sortieren nach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="createdAt">Erstellungsdatum</SelectItem>
                  <SelectItem value="lastAppointment">Letzter Besuch</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Reihenfolge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Aufsteigend</SelectItem>
                  <SelectItem value="desc">Absteigend</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={filterActive === true ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterActive(filterActive === true ? null : true)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Nur Aktive
              </Button>

              <Button
                variant={filterVip === true ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterVip(filterVip === true ? null : true)}
              >
                <Star className="mr-2 h-4 w-4" />
                Nur VIPs
              </Button>
            </div>
          </div>

          {/* Customers Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Letzter Besuch</TableHead>
                  <TableHead>Termine</TableHead>
                  <TableHead>Umsatz</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow 
                    key={customer.id} 
                    className="cursor-pointer"
                    onClick={() => handleCustomerClick(customer.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {customer.name}
                        {customer.vipStatus && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {formatPhoneForDisplay(customer.phone) || customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.lastAppointmentDate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(customer.lastAppointmentDate)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {customer.appointmentCount || 0} Termine
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.totalSpent ? (
                        <div className="flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {formatCurrency(customer.totalSpent)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.isActive ? "default" : "secondary"}>
                        {customer.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/appointments/new?customerId=${customer.id}`)
                          }}>
                            Termin buchen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleCustomerClick(customer.id)
                          }}>
                            Details anzeigen
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            toggleCustomerStatus(customer.id)
                          }}>
                            {customer.isActive ? 'Deaktivieren' : 'Aktivieren'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Zeige {customers.length} von {total} Kunden
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Zurück
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Weiter
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}