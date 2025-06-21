'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Clock, Tag, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/src/lib/utils/cn'
import type { Database } from '@/src/lib/supabase/database.types'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'
import type { ServicesGroupedByCategory } from '@/src/lib/services/service.service'

type Service = Database['public']['Tables']['Service']['Row']

interface ServiceSelectorProps {
  serviceGroups: ServicesGroupedByCategory[]
  selectedService: Service | null
  config: BookingPageConfig | null
  onServiceSelect: (service: Service) => void
}

export function ServiceSelector({
  serviceGroups,
  selectedService,
  config,
  onServiceSelect
}: ServiceSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Initialize expanded categories based on config
    if (serviceGroups.length > 0 && config?.layout.categoriesExpanded) {
      const allCategories = new Set(serviceGroups.map(group => group.category?.id || 'uncategorized'))
      setExpandedCategories(allCategories)
    }
  }, [serviceGroups, config?.layout.categoriesExpanded])

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const showCategories = config?.layout.showCategories ?? true // Default to showing categories

  return (
    <div>
      <CardHeader className="px-0 pt-0">
        <CardTitle>Service auswählen</CardTitle>
        <CardDescription>Wählen Sie die gewünschte Dienstleistung aus</CardDescription>
      </CardHeader>
      
      <div className="space-y-4 mt-6">
        {serviceGroups.map((group) => {
          const categoryId = group.category?.id || 'uncategorized'
          const isExpanded = expandedCategories.has(categoryId)
          const serviceCount = group.services.length
          
          return (
            <div key={categoryId} className={showCategories ? "border rounded-lg overflow-hidden" : ""}>
              {/* Category Header - Clickable */}
              {showCategories && (
                <button
                  onClick={() => toggleCategory(categoryId)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {group.category ? (
                      <>
                        <Tag className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">{group.category.name}</h3>
                        {group.category.description && (
                          <span className="text-sm text-muted-foreground">– {group.category.description}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <Layers className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Weitere Services</h3>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-normal">
                      {serviceCount} {serviceCount === 1 ? 'Service' : 'Services'}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>
              )}
              
              {/* Services Grid - Always visible if categories are hidden */}
              <div className={showCategories ? `transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}` : ''}>
                <div className={cn(
                  "p-4 gap-4",
                  config?.layout.serviceLayout === 'grid' ? 'grid md:grid-cols-2' : 'space-y-3'
                )}>
                  {group.services.map((service) => (
                    <Card 
                      key={service.id} 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedService?.id === service.id ? 'ring-2 ring-primary' : '',
                        config?.layout.serviceLayout === 'list' ? 'flex items-center' : ''
                      )}
                      onClick={() => onServiceSelect(service)}
                      style={{
                        borderColor: selectedService?.id === service.id ? config?.theme.primaryColor : config?.theme.secondaryColor,
                        borderRadius: `var(--radius)`,
                      }}
                    >
                      <CardContent className={cn(
                        "p-4",
                        config?.layout.serviceLayout === 'list' ? 'flex-1 flex items-center justify-between' : ''
                      )}>
                        <div className={config?.layout.serviceLayout === 'list' ? 'flex-1' : ''}>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{service.name}</h3>
                            {config?.layout.serviceLayout === 'grid' && config?.features.showPrices && (
                              <Badge variant="secondary" style={{ backgroundColor: config?.theme.accentColor, color: 'white' }}>
                                CHF {service.price.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                          )}
                          {config?.features.showDuration && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{service.duration} Min.</span>
                              </div>
                            </div>
                          )}
                        </div>
                        {config?.layout.serviceLayout === 'list' && config?.features.showPrices && (
                          <Badge variant="secondary" style={{ backgroundColor: config?.theme.accentColor, color: 'white' }}>
                            CHF {service.price.toFixed(2)}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}