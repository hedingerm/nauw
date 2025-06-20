'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, User, Mail, Phone, X } from 'lucide-react'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Card } from '@/src/components/ui/card'
import { CustomerService } from '@/src/lib/services/customer.service'
import { createCustomerSchema, type CreateCustomerInput } from '@/src/lib/schemas/customer'
import { debounce } from 'lodash'
import { cn } from '@/src/lib/utils'
import { formatPhoneForDisplay, formatPhoneInput } from '@/src/lib/utils/normalize'

interface CustomerSearchProps {
  businessId: string
  onSelectCustomer: (customer: any) => void
  onNewCustomer: (customerData: CreateCustomerInput) => void
  selectedCustomer?: any
}

export function CustomerSearch({
  businessId,
  onSelectCustomer,
  onNewCustomer,
  selectedCustomer,
}: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
    trigger,
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  })

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([])
        return
      }

      try {
        setSearching(true)
        const results = await CustomerService.search({
          businessId,
          query,
          limit: 5,
        })
        setSearchResults(results)
      } catch (error) {
        console.error('Error searching customers:', error)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300),
    [businessId]
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const handleSelectCustomer = (customer: any) => {
    onSelectCustomer(customer)
    setSearchQuery('')
    setSearchResults([])
    setShowNewCustomerForm(false)
  }

  const handleCreateNewCustomer = () => {
    setShowNewCustomerForm(true)
    setSearchResults([])
    // Pre-fill form if search query looks like email or phone
    if (searchQuery.includes('@')) {
      setValue('email', searchQuery)
    } else if (searchQuery.match(/^\+?[0-9\s-]+$/)) {
      setValue('phone', searchQuery)
    } else {
      setValue('name', searchQuery)
    }
  }

  const handleClearSelection = () => {
    onSelectCustomer(null)
    setSearchQuery('')
    reset()
  }

  const onSubmitNewCustomer = (data: CreateCustomerInput) => {
    onNewCustomer(data)
    setShowNewCustomerForm(false)
    setSearchQuery('')
    reset()
  }

  if (selectedCustomer) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {selectedCustomer.name}
                {selectedCustomer.isNew && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Neu
                  </span>
                )}
              </p>
              {selectedCustomer.email && (
                <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
              )}
              {selectedCustomer.phone && (
                <p className="text-sm text-muted-foreground">
                  {formatPhoneForDisplay(selectedCustomer.phone) || selectedCustomer.phone}
                </p>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Kunde suchen (Name, E-Mail oder Telefon)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Search Results */}
      {searchQuery.length >= 2 && !showNewCustomerForm && (
        <div className="space-y-2">
          {searching ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Suche läuft...
            </p>
          ) : searchResults.length > 0 ? (
            <>
              {searchResults.map((customer) => (
                <Card
                  key={customer.id}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{customer.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                        )}
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {formatPhoneForDisplay(customer.phone) || customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    {customer.visitCount > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {customer.visitCount} Besuche
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCreateNewCustomer}
              >
                Neuen Kunden anlegen
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Kein Kunde gefunden
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateNewCustomer}
              >
                Neuen Kunden anlegen
              </Button>
            </div>
          )}
        </div>
      )}

      {/* New Customer Form */}
      {showNewCustomerForm && (
        <Card className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium mb-3">Neuer Kunde</h4>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Max Mustermann"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail (optional)</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="max@beispiel.ch"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone', {
                  onChange: (e) => {
                    const formatted = formatPhoneInput(e.target.value)
                    setValue('phone', formatted)
                  }
                })}
                placeholder="079 123 45 67"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                size="sm" 
                className="flex-1"
                onClick={async () => {
                  const isValid = await trigger()
                  if (isValid) {
                    const values = getValues()
                    onSubmitNewCustomer(values)
                  }
                }}
              >
                Kunde anlegen
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewCustomerForm(false)
                  reset()
                }}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}