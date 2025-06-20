'use client'

import { useState } from 'react'
import { cn } from '@/src/lib/utils/cn'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'
import { BookingPageConfigService } from '@/src/lib/services/booking-config.service'
import { format, addDays, isSameDay } from 'date-fns'
import { de } from 'date-fns/locale'
import { 
  Check, MapPin, Phone, Mail, Clock, ChevronLeft, ChevronRight, 
  ChevronDown, ChevronUp, Tag, Layers, Facebook, Instagram, Twitter, 
  Linkedin, Youtube, Globe, Music2 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Checkbox } from '@/src/components/ui/checkbox'

interface BookingPreviewProps {
  config: BookingPageConfig
  business: any
  device: 'desktop' | 'tablet' | 'mobile'
  compact?: boolean
}

type PreviewStep = 'service' | 'datetime' | 'customer' | 'confirmation'

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  website: Globe,
  tiktok: Music2,
}

// Mock data for preview
const mockServices = [
  { id: '1', name: 'Haarschnitt', description: 'Professioneller Haarschnitt mit Beratung', price: 65, duration: 45, category: 'hair' },
  { id: '2', name: 'Färben', description: 'Haare färben mit Premium-Produkten', price: 120, duration: 90, category: 'hair' },
  { id: '3', name: 'Maniküre', description: 'Klassische Maniküre mit Nagellack', price: 45, duration: 30, category: 'nails' },
  { id: '4', name: 'Pediküre', description: 'Entspannende Fußpflege', price: 55, duration: 45, category: 'nails' },
]

const mockCategories = [
  { id: 'hair', name: 'Haare', description: 'Alle Haar-Services' },
  { id: 'nails', name: 'Nägel', description: 'Maniküre und Pediküre' },
]

const mockTimeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']

export function BookingPreview({ config, business, device, compact = false }: BookingPreviewProps) {
  const [currentStep, setCurrentStep] = useState<PreviewStep>('service')
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(config.layout.categoriesExpanded ? mockCategories.map(c => c.id) : [])
  )
  const [weekOffset, setWeekOffset] = useState(0)

  const deviceClasses = {
    desktop: 'w-full',
    tablet: 'max-w-3xl mx-auto',
    mobile: compact ? 'w-full' : 'max-w-sm mx-auto',
  }

  const themeStyles = BookingPageConfigService.getThemeCSSVariables(config.theme)

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const groupServicesByCategory = () => {
    const groups: any[] = []
    const categorizedServices: Record<string, any[]> = {}
    
    mockServices.forEach(service => {
      if (!categorizedServices[service.category]) {
        categorizedServices[service.category] = []
      }
      categorizedServices[service.category].push(service)
    })
    
    mockCategories.forEach(category => {
      if (categorizedServices[category.id]) {
        groups.push({
          category,
          services: categorizedServices[category.id]
        })
      }
    })
    
    return groups
  }

  const getFilteredTimeSlots = () => {
    const interval = config.layout.timeSlotInterval
    if (interval <= 15) return mockTimeSlots
    
    return mockTimeSlots.filter(slot => {
      const [hours, minutes] = slot.split(':').map(Number)
      const totalMinutes = hours * 60 + minutes
      return totalMinutes % interval === 0
    })
  }

  const renderCalendarView = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDays = config.layout.maxAdvanceBookingDays

    switch (config.layout.calendarView) {
      case 'list':
        return (
          <div className="mt-2 space-y-2 max-h-96 overflow-y-auto border rounded-md p-4">
            {Array.from({ length: Math.min(10, maxDays) }, (_, i) => {
              const date = addDays(today, i)
              return (
                <button
                  key={i}
                  className={cn(
                    "w-full text-left p-2 rounded transition-colors",
                    selectedDate && isSameDay(selectedDate, date) 
                      ? 'text-white' 
                      : 'border hover:bg-gray-50'
                  )}
                  onClick={() => setSelectedDate(date)}
                  style={selectedDate && isSameDay(selectedDate, date) ? {
                    backgroundColor: config.theme.primaryColor,
                    borderColor: config.theme.primaryColor
                  } : {
                    borderColor: config.theme.secondaryColor
                  }}
                >
                  {format(date, 'EEEE, d. MMMM yyyy', { locale: de })}
                </button>
              )
            })}
          </div>
        )
      
      case 'week':
        const baseStartOfWeek = new Date(today)
        baseStartOfWeek.setDate(today.getDate() - today.getDay() + 1)
        const startOfWeek = addDays(baseStartOfWeek, weekOffset * 7)
        
        return (
          <div className="mt-2 border rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekOffset(weekOffset - 1)}
                disabled={weekOffset <= 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center">
                <p className="font-medium">
                  {format(startOfWeek, 'MMMM yyyy', { locale: de })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(startOfWeek, 'd.')} - {format(addDays(startOfWeek, 6), 'd. MMMM', { locale: de })}
                </p>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekOffset(weekOffset + 1)}
                disabled={addDays(startOfWeek, 7) > addDays(today, maxDays)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }, (_, i) => {
                const date = addDays(startOfWeek, i)
                const isDisabled = date < today || date > addDays(today, maxDays)
                const isToday = isSameDay(date, today)
                
                return (
                  <button
                    key={i}
                    className={cn(
                      "flex flex-col items-center p-2 text-xs rounded transition-colors",
                      selectedDate && isSameDay(selectedDate, date) 
                        ? 'text-white' 
                        : 'border hover:bg-gray-50',
                      isDisabled && 'opacity-50 cursor-not-allowed',
                      isToday && 'ring-2 ring-offset-1'
                    )}
                    onClick={() => !isDisabled && setSelectedDate(date)}
                    disabled={isDisabled}
                    style={selectedDate && isSameDay(selectedDate, date) ? {
                      backgroundColor: config.theme.primaryColor,
                      borderColor: config.theme.primaryColor
                    } : isToday ? {
                      borderColor: config.theme.primaryColor
                    } : {
                      borderColor: config.theme.secondaryColor
                    }}
                  >
                    <span className="text-[10px]">{format(date, 'EEE', { locale: de })}</span>
                    <span className="text-sm font-semibold">{format(date, 'd')}</span>
                    {isToday && <span className="text-[10px]">Heute</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )
      
      default: // month view
        return (
          <div className="mt-2 rounded-lg border p-4" style={{ borderColor: config.theme.secondaryColor }}>
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div key={day} className="font-medium opacity-70">{day}</div>
              ))}
              {Array.from({ length: 28 }, (_, i) => {
                const date = addDays(today, i)
                const isSelected = selectedDate && isSameDay(selectedDate, date)
                const isWeekend = i % 7 === 5 || i % 7 === 6
                
                return (
                  <button
                    key={i}
                    className={cn(
                      "p-1 rounded text-xs cursor-pointer transition-colors",
                      isWeekend ? 'opacity-50' : 'hover:bg-gray-100',
                      isSelected && 'text-white font-semibold'
                    )}
                    onClick={() => setSelectedDate(date)}
                    style={{
                      backgroundColor: isSelected ? config.theme.primaryColor : 'transparent',
                      color: isSelected ? 'white' : 'inherit',
                      border: isSelected ? `2px solid ${config.theme.primaryColor}` : '1px solid transparent',
                    }}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>
        )
    }
  }

  return (
    <div className={cn(
      "bg-white rounded-lg overflow-hidden",
      deviceClasses[device],
      compact && "shadow-lg"
    )}>
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      
      <div className={cn(
        "booking-preview",
        compact ? "" : "min-h-screen"
      )} style={{ 
        backgroundColor: config.theme.backgroundColor,
        color: config.theme.textColor,
        fontFamily: `${config.theme.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
      }}>
        {/* Header with Cover Image and Logo */}
        {(config.logoUrl || config.coverImageUrl) && (
          <div className={cn("relative", compact ? "mb-4" : "mb-8")}>
            {/* Cover Image */}
            {config.coverImageUrl && (
              <div className={cn(
                "bg-cover bg-center relative",
                compact ? "h-32" : "h-48 md:h-64"
              )} style={{ backgroundImage: `url(${config.coverImageUrl})` }}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
              </div>
            )}
            
            {/* Logo - Centered and visible over cover */}
            {config.logoUrl && (
              <div className={cn(
                "flex justify-center",
                config.coverImageUrl ? "absolute inset-0 items-center" : compact ? "py-4" : "py-8"
              )}>
                <div className={cn(
                  "rounded-lg",
                  config.coverImageUrl ? "bg-white/90 backdrop-blur-sm shadow-lg p-3" : "",
                  compact ? "p-2" : "p-4"
                )}>
                  <img 
                    src={config.logoUrl} 
                    alt={business.name} 
                    className={cn(
                      "object-contain",
                      compact ? "h-12 max-w-[150px]" : "h-20 md:h-24 max-w-[200px]"
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className={cn(
          "container max-w-4xl mx-auto",
          compact ? "px-3 py-4" : "px-4 py-8"
        )}>
          {/* Business Header */}
          <div className={cn("text-center", compact ? "mb-4" : "mb-8")}>
            <h1 className={cn("font-bold", compact ? "text-xl mb-1" : "text-3xl mb-2")} style={{ color: config.theme.primaryColor }}>
              {config.content.welcomeTitle || business.name}
            </h1>
            {config.content.welcomeText ? (
              <p className={cn("opacity-80", compact ? "text-sm mb-2" : "text-lg mb-4")}>{config.content.welcomeText}</p>
            ) : business.description && (
              <p className={cn("text-muted-foreground", compact ? "text-sm mb-2" : "mb-4")}>{business.description}</p>
            )}
          </div>

          {/* Progress Steps */}
          <div className={cn("px-4", compact ? "mb-4" : "mb-8")}>
            <div className={cn("flex items-center justify-center", compact ? "space-x-1" : "space-x-2 sm:space-x-4")}>
              {/* Step 1: Service */}
              <div className="flex items-center">
                <div 
                  className={cn(
                    "rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    compact ? "h-6 w-6" : "h-8 w-8"
                  )}
                  style={{
                    borderColor: ['service', 'datetime', 'customer', 'confirmation'].includes(currentStep) ? config.theme.primaryColor : '#e5e7eb',
                    backgroundColor: ['service', 'datetime', 'customer', 'confirmation'].includes(currentStep) ? config.theme.primaryColor : 'transparent',
                    color: ['service', 'datetime', 'customer', 'confirmation'].includes(currentStep) ? 'white' : currentStep === 'service' ? config.theme.primaryColor : '#9ca3af'
                  }}
                >
                  {['datetime', 'customer', 'confirmation'].includes(currentStep) ? <Check className={compact ? "h-3 w-3" : "h-4 w-4"} /> : <span className={compact ? "text-xs" : ""}>1</span>}
                </div>
                <span className="ml-2 hidden sm:inline font-medium" style={{ 
                  color: currentStep === 'service' ? config.theme.primaryColor : '#6b7280' 
                }}>Service</span>
              </div>
              
              <div className={cn("flex-1 h-0.5", compact ? "max-w-[2rem]" : "max-w-[4rem]")} style={{ 
                backgroundColor: ['datetime', 'customer', 'confirmation'].includes(currentStep) ? config.theme.primaryColor : '#e5e7eb' 
              }} />
              
              {/* Step 2: DateTime */}
              <div className="flex items-center">
                <div 
                  className={cn(
                    "rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    compact ? "h-6 w-6" : "h-8 w-8"
                  )}
                  style={{
                    borderColor: ['datetime', 'customer', 'confirmation'].includes(currentStep) ? config.theme.primaryColor : currentStep === 'datetime' ? config.theme.primaryColor : '#e5e7eb',
                    backgroundColor: ['datetime', 'customer', 'confirmation'].includes(currentStep) ? config.theme.primaryColor : 'transparent',
                    color: ['datetime', 'customer', 'confirmation'].includes(currentStep) ? 'white' : currentStep === 'datetime' ? config.theme.primaryColor : '#9ca3af'
                  }}
                >
                  {['customer', 'confirmation'].includes(currentStep) ? <Check className={compact ? "h-3 w-3" : "h-4 w-4"} /> : <span className={compact ? "text-xs" : ""}>2</span>}
                </div>
                <span className="ml-2 hidden sm:inline font-medium" style={{ 
                  color: currentStep === 'datetime' ? config.theme.primaryColor : '#6b7280' 
                }}>Termin</span>
              </div>
              
              <div className={cn("flex-1 h-0.5", compact ? "max-w-[2rem]" : "max-w-[4rem]")} style={{ 
                backgroundColor: ['customer', 'confirmation'].includes(currentStep) ? config.theme.primaryColor : '#e5e7eb' 
              }} />
              
              {/* Step 3: Customer */}
              <div className="flex items-center">
                <div 
                  className={cn(
                    "rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    compact ? "h-6 w-6" : "h-8 w-8"
                  )}
                  style={{
                    borderColor: ['customer', 'confirmation'].includes(currentStep) ? config.theme.primaryColor : currentStep === 'customer' ? config.theme.primaryColor : '#e5e7eb',
                    backgroundColor: ['customer', 'confirmation'].includes(currentStep) ? config.theme.primaryColor : 'transparent',
                    color: ['customer', 'confirmation'].includes(currentStep) ? 'white' : currentStep === 'customer' ? config.theme.primaryColor : '#9ca3af'
                  }}
                >
                  {currentStep === 'confirmation' ? <Check className={compact ? "h-3 w-3" : "h-4 w-4"} /> : <span className={compact ? "text-xs" : ""}>3</span>}
                </div>
                <span className="ml-2 hidden sm:inline font-medium" style={{ 
                  color: currentStep === 'customer' ? config.theme.primaryColor : '#6b7280' 
                }}>Kontakt</span>
              </div>
              
              <div className={cn("flex-1 h-0.5", compact ? "max-w-[2rem]" : "max-w-[4rem]")} style={{ 
                backgroundColor: currentStep === 'confirmation' ? config.theme.primaryColor : '#e5e7eb' 
              }} />
              
              {/* Step 4: Confirmation */}
              <div className="flex items-center">
                <div 
                  className={cn(
                    "rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    compact ? "h-6 w-6" : "h-8 w-8"
                  )}
                  style={{
                    borderColor: currentStep === 'confirmation' ? config.theme.primaryColor : '#e5e7eb',
                    backgroundColor: currentStep === 'confirmation' ? config.theme.primaryColor : 'transparent',
                    color: currentStep === 'confirmation' ? 'white' : '#9ca3af'
                  }}
                >
                  {currentStep === 'confirmation' ? <Check className={compact ? "h-3 w-3" : "h-4 w-4"} /> : <span className={compact ? "text-xs" : ""}>4</span>}
                </div>
                <span className="ml-2 hidden sm:inline font-medium" style={{ 
                  color: currentStep === 'confirmation' ? config.theme.primaryColor : '#6b7280' 
                }}>Bestätigung</span>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="p-6">
              {/* Service Selection */}
              {currentStep === 'service' && (
                <div>
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Service auswählen</CardTitle>
                    <CardDescription>Wählen Sie die gewünschte Dienstleistung aus</CardDescription>
                  </CardHeader>
                
                  <div className="space-y-4 mt-6">
                    {config.layout.showCategories ? (
                      groupServicesByCategory().map((group) => (
                        <div key={group.category.id} className="border rounded-lg overflow-hidden">
                          {/* Category Header - Clickable */}
                          <button
                            onClick={() => toggleCategory(group.category.id)}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="h-5 w-5 text-muted-foreground" />
                              <h3 className="text-lg font-semibold">{group.category.name}</h3>
                              {group.category.description && (
                                <span className="text-sm text-muted-foreground">– {group.category.description}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-normal">
                                {group.services.length} {group.services.length === 1 ? 'Service' : 'Services'}
                              </Badge>
                              {expandedCategories.has(group.category.id) ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                          
                          {/* Services Grid */}
                          {expandedCategories.has(group.category.id) && (
                            <div className="transition-all duration-300 max-h-[2000px] opacity-100">
                              <div className={cn(
                                "p-4 gap-4",
                                config.layout.serviceLayout === 'grid' ? 'grid md:grid-cols-2' : 'space-y-3'
                              )}>
                                {group.services.map((service: any) => (
                                  <Card 
                                    key={service.id} 
                                    className={cn(
                                      "cursor-pointer transition-all hover:shadow-md",
                                      selectedService?.id === service.id ? 'ring-2 ring-primary' : '',
                                      config.layout.serviceLayout === 'list' ? 'flex items-center' : ''
                                    )}
                                    onClick={() => {
                                      setSelectedService(service)
                                      setCurrentStep('datetime')
                                    }}
                                    style={{
                                      borderColor: config.theme.secondaryColor,
                                      borderRadius: `var(--radius)`,
                                    }}
                                  >
                                    <CardContent className={cn(
                                      "p-4",
                                      config.layout.serviceLayout === 'list' ? 'flex-1 flex items-center justify-between' : ''
                                    )}>
                                      <div className={config.layout.serviceLayout === 'list' ? 'flex-1' : ''}>
                                        <div className="flex justify-between items-start mb-2">
                                          <h3 className="font-semibold">{service.name}</h3>
                                          {config.layout.serviceLayout === 'grid' && config.features.showPrices && (
                                            <Badge variant="secondary" style={{ backgroundColor: config.theme.accentColor, color: 'white' }}>
                                              CHF {service.price.toFixed(2)}
                                            </Badge>
                                          )}
                                        </div>
                                        {service.description && (
                                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                                        )}
                                        {config.features.showDuration && (
                                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <Clock className="h-4 w-4" />
                                              <span>{service.duration} Min.</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {config.layout.serviceLayout === 'list' && config.features.showPrices && (
                                        <Badge variant="secondary" style={{ backgroundColor: config.theme.accentColor, color: 'white' }}>
                                          CHF {service.price.toFixed(2)}
                                        </Badge>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={cn(
                        "gap-4",
                        config.layout.serviceLayout === 'grid' ? 'grid md:grid-cols-2' : 'space-y-3'
                      )}>
                        {mockServices.map((service) => (
                          <Card 
                            key={service.id} 
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-md",
                              selectedService?.id === service.id ? 'ring-2 ring-primary' : '',
                              config.layout.serviceLayout === 'list' ? 'flex items-center' : ''
                            )}
                            onClick={() => {
                              setSelectedService(service)
                              setCurrentStep('datetime')
                            }}
                            style={{
                              borderColor: config.theme.secondaryColor,
                              borderRadius: `var(--radius)`,
                            }}
                          >
                            <CardContent className={cn(
                              "p-4",
                              config.layout.serviceLayout === 'list' ? 'flex-1 flex items-center justify-between' : ''
                            )}>
                              <div className={config.layout.serviceLayout === 'list' ? 'flex-1' : ''}>
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold">{service.name}</h3>
                                  {config.layout.serviceLayout === 'grid' && config.features.showPrices && (
                                    <Badge variant="secondary" style={{ backgroundColor: config.theme.accentColor, color: 'white' }}>
                                      CHF {service.price.toFixed(2)}
                                    </Badge>
                                  )}
                                </div>
                                {service.description && (
                                  <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                                )}
                                {config.features.showDuration && (
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{service.duration} Min.</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {config.layout.serviceLayout === 'list' && config.features.showPrices && (
                                <Badge variant="secondary" style={{ backgroundColor: config.theme.accentColor, color: 'white' }}>
                                  CHF {service.price.toFixed(2)}
                                </Badge>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Date & Time Selection */}
              {currentStep === 'datetime' && selectedService && (
                <div>
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Termin auswählen</CardTitle>
                    <CardDescription>
                      Wählen Sie Ihren Wunschtermin für: {selectedService.name}
                    </CardDescription>
                  </CardHeader>

                  {/* Date and Time Selection - Show immediately */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label>Datum auswählen</Label>
                      {renderCalendarView()}
                    </div>
                  
                    {/* Time Slots */}
                    {selectedDate && (
                      <div>
                        <Label>Zeit auswählen</Label>
                        <div className="space-y-4">
                          {/* Show info about multiple employees if any slot has more than 1 */}
                          {config.layout.showEmployeeSelection && (
                            <p className="text-sm text-muted-foreground">
                              Die Zahl zeigt an, wie viele Mitarbeiter zu dieser Zeit verfügbar sind.
                            </p>
                          )}
                          <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                            {getFilteredTimeSlots().map((time, i) => (
                              <div key={time} className="relative">
                                <Button
                                  variant={selectedTime === time ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTime(time)
                                    setCurrentStep('customer')
                                  }}
                                  className="w-full relative overflow-visible"
                                  style={selectedTime === time ? { 
                                    backgroundColor: config.theme.primaryColor,
                                    borderColor: config.theme.primaryColor 
                                  } : {
                                    borderColor: config.theme.secondaryColor
                                  }}
                                >
                                  {time}
                                  {config.layout.showEmployeeSelection && i % 3 === 0 && (
                                    <span 
                                      className="absolute -top-2 -right-2 text-white text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-sm"
                                      style={{ backgroundColor: config.theme.accentColor }}
                                    >
                                      2
                                    </span>
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                          
                          {/* Selected Time Info */}
                          {selectedTime && (
                            <div className="mt-8 p-3 bg-muted rounded-lg">
                              <p className="text-sm">
                                <strong>Ausgewählter Termin:</strong> {selectedTime} Uhr
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Information */}
              {currentStep === 'customer' && (
                <div>
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Ihre Kontaktdaten</CardTitle>
                    <CardDescription>
                      Bitte geben Sie Ihre Kontaktinformationen ein
                    </CardDescription>
                  </CardHeader>

                  <div className="space-y-4 mt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Vorname *</Label>
                        <Input
                          id="firstName"
                          placeholder="Max"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nachname *</Label>
                        <Input
                          id="lastName"
                          placeholder="Mustermann"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="max@example.com"
                        required
                      />
                    </div>

                    {config.features.requirePhone && (
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefonnummer *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+41 79 123 45 67"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Sie können die Nummer in jedem Format eingeben: 079 123 45 67, 0791234567, +41791234567
                        </p>
                      </div>
                    )}

                    {config.features.allowCustomerNotes && (
                      <div className="space-y-2">
                        <Label htmlFor="notes">{config.content.notesLabel || 'Anmerkungen'} {config.content.requireNotes ? '*' : '(optional)'}</Label>
                        <Textarea
                          id="notes"
                          placeholder={config.content.notesLabel || "Besondere Wünsche oder Anmerkungen..."}
                          rows={3}
                          required={config.content.requireNotes}
                        />
                      </div>
                    )}

                    {config.features.showMarketingConsent && (
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="marketing"
                          defaultChecked={true}
                          className="border-gray-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
                          style={{
                            backgroundColor: config.theme.primaryColor || '#2563eb',
                            borderColor: config.theme.primaryColor || '#2563eb',
                          }}
                        />
                        <Label htmlFor="marketing" className="text-sm cursor-pointer">
                          Ich möchte über Neuigkeiten und Angebote informiert werden
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Confirmation */}
              {currentStep === 'confirmation' && (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl mb-2">
                      Termin erfolgreich gebucht!
                    </CardTitle>
                    <CardDescription>
                      {config.content.successMessage || 'Ihr Termin wurde bestätigt. Sie erhalten eine Bestätigung per E-Mail.'}
                    </CardDescription>
                  </div>

                  <Card className="max-w-md mx-auto text-left">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Termindetails</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service:</span>
                          <span className="font-medium">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mitarbeiter:</span>
                          <span className="font-medium">Max Mustermann</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Datum:</span>
                          <span className="font-medium">
                            {selectedDate && format(selectedDate, 'dd. MMMM yyyy', { locale: de })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Zeit:</span>
                          <span className="font-medium">{selectedTime} Uhr</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dauer:</span>
                          <span className="font-medium">{selectedService?.duration} Minuten</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Preis:</span>
                          <span className="font-medium">CHF {selectedService?.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button 
                    className="mt-6"
                    size="lg"
                    style={{ backgroundColor: config.theme.primaryColor }}
                  >
                    Neue Buchung
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          {currentStep !== 'confirmation' && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  switch (currentStep) {
                    case 'datetime':
                      setCurrentStep('service')
                      break
                    case 'customer':
                      setCurrentStep('datetime')
                      break
                  }
                }}
                disabled={currentStep === 'service'}
                style={{ borderColor: config.theme.secondaryColor }}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              
              <Button
                onClick={() => {
                  switch (currentStep) {
                    case 'service':
                      if (selectedService) setCurrentStep('datetime')
                      break
                    case 'datetime':
                      if (selectedDate && selectedTime) setCurrentStep('customer')
                      break
                    case 'customer':
                      setCurrentStep('confirmation')
                      break
                  }
                }}
                disabled={
                  (currentStep === 'service' && !selectedService) ||
                  (currentStep === 'datetime' && (!selectedDate || !selectedTime))
                }
                style={{ backgroundColor: config.theme.primaryColor }}
              >
                {currentStep === 'customer' ? (
                  'Termin buchen'
                ) : (
                  <>
                    Weiter
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Business Contact Info */}
          <div className={cn("pt-8 border-t", compact ? "mt-6" : "mt-12")} style={{ borderColor: config.theme.secondaryColor }}>
            <div className={cn("flex flex-wrap justify-center gap-4 text-muted-foreground mb-6", compact ? "text-xs gap-2" : "text-sm")}>
              {business.address && (
                <div className="flex items-center gap-1">
                  <MapPin className={compact ? "h-3 w-3" : "h-4 w-4"} />
                  <span>{business.address}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-1">
                  <Phone className={compact ? "h-3 w-3" : "h-4 w-4"} />
                  <span>{business.phone}</span>
                </div>
              )}
              {business.email && (
                <div className="flex items-center gap-1">
                  <Mail className={compact ? "h-3 w-3" : "h-4 w-4"} />
                  <span>{business.email}</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            {config.content.showSocialLinks && Object.keys(config.content.socialLinks).length > 0 && (
              <div className="flex justify-center gap-4">
                {Object.entries(config.content.socialLinks).map(([platform, url]) => {
                  const Icon = socialIcons[platform as keyof typeof socialIcons] || Globe
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("opacity-60 hover:opacity-100 transition-opacity", compact ? "text-xl" : "text-2xl")}
                      style={{ color: config.theme.secondaryColor }}
                    >
                      <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}