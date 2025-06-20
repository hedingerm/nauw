'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { ProgressIndicator } from '@/src/components/onboarding/progress-indicator'
import { BusinessHoursSelector } from '@/src/components/onboarding/business-hours-selector'
import { FormTooltip } from '@/src/components/onboarding/form-tooltip'
import { Checkbox } from '@/src/components/ui/checkbox'
import { toast } from 'sonner'
import { BusinessService } from '@/src/lib/services/business.service'
import { 
  businessInfoSchema, 
  businessHoursSchema, 
  employeeInfoSchema, 
  serviceInfoSchema,
  type BusinessInfo,
  type BusinessHours,
  type EmployeeInfo,
  type ServiceInfo,
} from '@/src/lib/schemas/onboarding'
import { 
  BuildingOfficeIcon, 
  ClockIcon, 
  UserIcon, 
  UsersIcon, 
  BriefcaseIcon 
} from '@heroicons/react/24/outline'

const BUSINESS_TYPES = [
  { value: 'salon', label: 'Friseursalon' },
  { value: 'spa', label: 'Wellness & Spa' },
  { value: 'clinic', label: 'Praxis' },
  { value: 'fitness', label: 'Fitness & Sport' },
  { value: 'beauty', label: 'Kosmetik' },
  { value: 'therapy', label: 'Therapie' },
  { value: 'other', label: 'Sonstiges' },
]

const SERVICE_DURATIONS = [
  { value: 15, label: '15 Minuten' },
  { value: 30, label: '30 Minuten' },
  { value: 45, label: '45 Minuten' },
  { value: 60, label: '1 Stunde' },
  { value: 90, label: '1,5 Stunden' },
  { value: 120, label: '2 Stunden' },
]

const STEPS = [
  'Geschäftsdaten',
  'Öffnungszeiten',
  'Inhaber',
  'Mitarbeiter',
  'Service',
]

type OnboardingData = {
  businessInfo: BusinessInfo & { country: string }
  businessHours: BusinessHours
  ownerInfo: EmployeeInfo & { role: string; canPerformServices: boolean }
  additionalEmployee?: EmployeeInfo & { role: string; canPerformServices: boolean }
  serviceInfo?: ServiceInfo & { bufferBefore: number; bufferAfter: number }
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<Partial<OnboardingData>>({})
  const [tempEmployeeIds, setTempEmployeeIds] = useState<string[]>([])
  const [skipEmployee, setSkipEmployee] = useState(false)
  const [skipService, setSkipService] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const router = useRouter()

  // Step 1: Business Information
  const businessForm = useForm({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: data.businessInfo || {
      country: 'Schweiz',
    },
  })

  // Step 2: Business Hours
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    data.businessHours || {
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false },
      friday: { isOpen: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false },
      saturday: { isOpen: false, openTime: '09:00', closeTime: '13:00', hasLunchBreak: false },
      sunday: { isOpen: false, openTime: '09:00', closeTime: '13:00', hasLunchBreak: false },
    }
  )

  // Step 3: Owner Information
  const ownerForm = useForm({
    resolver: zodResolver(employeeInfoSchema),
    defaultValues: data.ownerInfo || {
      role: 'Inhaber',
      canPerformServices: true,
    },
  })

  // Step 4: Additional Employee
  const employeeForm = useForm({
    resolver: zodResolver(employeeInfoSchema),
    defaultValues: data.additionalEmployee || {
      role: 'Mitarbeiter',
      canPerformServices: true,
    },
  })

  // Step 5: Service Information
  const serviceForm = useForm({
    resolver: zodResolver(serviceInfoSchema),
    defaultValues: data.serviceInfo || {
      duration: 30,
      price: 0,
      bufferBefore: 0,
      bufferAfter: 5,
      employeeIds: [],
    },
  })

  const handleNextStep = async () => {
    let isValid = false
    console.log('handleNextStep called, currentStep:', currentStep)

    switch (currentStep) {
      case 1:
        isValid = await businessForm.trigger()
        if (isValid) {
          setData(prev => ({ ...prev, businessInfo: businessForm.getValues() as any }))
        }
        break
      case 2:
        // Business hours are always valid
        setData(prev => ({ ...prev, businessHours }))
        isValid = true
        break
      case 3:
        isValid = await ownerForm.trigger()
        if (isValid) {
          setData(prev => ({ ...prev, ownerInfo: ownerForm.getValues() as any }))
          setTempEmployeeIds(['owner']) // Temporary ID for the owner
        }
        break
      case 4:
        if (skipEmployee) {
          isValid = true
        } else {
          isValid = await employeeForm.trigger()
          if (isValid) {
            setData(prev => ({ ...prev, additionalEmployee: employeeForm.getValues() as any }))
            setTempEmployeeIds(['owner', 'employee']) // Add temporary ID for employee
          }
        }
        break
      case 5:
        if (!skipService) {
          console.log('Step 5 - validating service form')
          console.log('Current service form values:', serviceForm.getValues())
          console.log('Current employeeIds:', serviceForm.getValues('employeeIds'))
          isValid = await serviceForm.trigger()
          console.log('Service form validation result:', isValid)
          if (isValid) {
            const serviceData = serviceForm.getValues()
            console.log('Saving service data to state:', serviceData)
            setData(prev => ({ ...prev, serviceInfo: serviceData as any }))
          } else {
            console.log('Service form validation errors:', serviceForm.formState.errors)
          }
        } else {
          isValid = true
        }
        break
    }

    if (isValid) {
      if (currentStep === 5) {
        // Submit the onboarding data
        // Pass the current service data directly since state updates are async
        const currentServiceData = !skipService ? serviceForm.getValues() : undefined
        await handleSubmit(currentServiceData)
      } else {
        // Moving to the next step
        if (currentStep === 4) {
          // Set employeeIds when entering step 5
          serviceForm.setValue('employeeIds', tempEmployeeIds)
        }
        setCurrentStep(prev => prev + 1)
      }
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (currentServiceData?: any) => {
    if (isSubmitting) {
      console.log('Already submitting, skipping...')
      return
    }
    
    try {
      setIsSubmitting(true)
      console.log('Submitting onboarding data:', {
        business: data.businessInfo,
        businessHours: data.businessHours,
        owner: data.ownerInfo,
        additionalEmployee: data.additionalEmployee,
        service: data.serviceInfo,
      })

      // Validate required data
      if (!data.businessInfo) {
        toast.error('Geschäftsdaten fehlen', {
          description: 'Bitte gehen Sie zurück und füllen Sie die Geschäftsinformationen aus.',
        })
        setIsSubmitting(false)
        return
      }

      if (!data.businessHours) {
        toast.error('Öffnungszeiten fehlen', {
          description: 'Bitte gehen Sie zurück und legen Sie die Öffnungszeiten fest.',
        })
        setIsSubmitting(false)
        return
      }

      if (!data.ownerInfo) {
        toast.error('Inhaberdaten fehlen', {
          description: 'Bitte gehen Sie zurück und füllen Sie Ihre Informationen aus.',
        })
        setIsSubmitting(false)
        return
      }

      console.log('=== ONBOARDING SUBMISSION DEBUG ===')
      console.log('Current data state:', data)
      console.log('skipService flag:', skipService)
      console.log('skipEmployee flag:', skipEmployee)
      console.log('currentServiceData parameter:', currentServiceData)
      
      // Prepare the submission data
      // Use currentServiceData if provided (from step 5), otherwise use state
      const serviceData = currentServiceData || data.serviceInfo
      
      const submissionData = {
        business: {
          ...data.businessInfo!,
          businessHours: data.businessHours!,
        },
        owner: data.ownerInfo!,
        additionalEmployee: skipEmployee ? undefined : data.additionalEmployee,
        service: skipService ? undefined : serviceData,
      }

      console.log('Final submission data:', submissionData)
      console.log('Service data from state:', data.serviceInfo)
      console.log('=== END DEBUG ===')

      const result = await BusinessService.completeOnboarding(submissionData)

      if (result.success) {
        toast.success('Willkommen bei CalBok!', {
          description: 'Ihr Konto wurde erfolgreich eingerichtet.',
        })
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Onboarding error:', error)
      
      // Check for specific TRPC errors
      if (error.data?.code === 'UNAUTHORIZED') {
        toast.error('Nicht autorisiert', {
          description: 'Bitte melden Sie sich erneut an.',
        })
        router.push('/login')
      } else if (error.data?.code === 'CONFLICT') {
        toast.error('Konflikt', {
          description: error.message || 'Ein Unternehmen existiert bereits.',
        })
      } else {
        toast.error('Ein Fehler ist aufgetreten', {
          description: error.message || 'Bitte versuchen Sie es erneut.',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center">Willkommen bei CalBok!</h1>
          <p className="text-center text-muted-foreground mt-2">
            Richten Sie Ihr Geschäft in wenigen Schritten ein
          </p>
        </div>

        <ProgressIndicator 
          currentStep={currentStep} 
          totalSteps={5} 
          steps={STEPS} 
        />

        <Card className="mt-8">
          {/* Step 1: Business Information */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Geschäftsinformationen</CardTitle>
                </div>
                <CardDescription>
                  Grundlegende Informationen über Ihr Unternehmen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={businessForm.handleSubmit(() => handleNextStep())} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Geschäftsname</Label>
                      <Input
                        id="name"
                        {...businessForm.register('name')}
                        placeholder="z.B. Salon Schönheit"
                      />
                      {businessForm.formState.errors.name && (
                        <p className="text-sm text-destructive mt-1">
                          {businessForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="type">Geschäftstyp</Label>
                        <FormTooltip content="Wählen Sie die Kategorie, die Ihr Geschäft am besten beschreibt" />
                      </div>
                      <select
                        id="type"
                        {...businessForm.register('type')}
                        className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
                      >
                        <option value="">Bitte wählen...</option>
                        {BUSINESS_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {businessForm.formState.errors.type && (
                        <p className="text-sm text-destructive mt-1">
                          {businessForm.formState.errors.type.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefonnummer</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...businessForm.register('phone')}
                        placeholder="+41 79 123 45 67"
                      />
                      {businessForm.formState.errors.phone && (
                        <p className="text-sm text-destructive mt-1">
                          {businessForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email">E-Mail-Adresse</Label>
                      <Input
                        id="email"
                        type="email"
                        {...businessForm.register('email')}
                        placeholder="kontakt@beispiel.ch"
                      />
                      {businessForm.formState.errors.email && (
                        <p className="text-sm text-destructive mt-1">
                          {businessForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="street">Straße und Hausnummer</Label>
                    <Input
                      id="street"
                      {...businessForm.register('street')}
                      placeholder="Musterstraße 123"
                    />
                    {businessForm.formState.errors.street && (
                      <p className="text-sm text-destructive mt-1">
                        {businessForm.formState.errors.street.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="postalCode">PLZ</Label>
                      <Input
                        id="postalCode"
                        {...businessForm.register('postalCode')}
                        placeholder="8000"
                      />
                      {businessForm.formState.errors.postalCode && (
                        <p className="text-sm text-destructive mt-1">
                          {businessForm.formState.errors.postalCode.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="city">Stadt</Label>
                      <Input
                        id="city"
                        {...businessForm.register('city')}
                        placeholder="Zürich"
                      />
                      {businessForm.formState.errors.city && (
                        <p className="text-sm text-destructive mt-1">
                          {businessForm.formState.errors.city.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="country">Land</Label>
                      <Input
                        id="country"
                        {...businessForm.register('country')}
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Beschreibung (optional)</Label>
                    <Textarea
                      id="description"
                      {...businessForm.register('description')}
                      placeholder="Beschreiben Sie Ihr Geschäft kurz..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Weiter</Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* Step 2: Business Hours */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Öffnungszeiten</CardTitle>
                </div>
                <CardDescription>
                  Wann ist Ihr Geschäft geöffnet?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessHoursSelector 
                  value={businessHours as any} 
                  onChange={setBusinessHours as any} 
                />
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={handlePreviousStep}>
                    Zurück
                  </Button>
                  <Button onClick={handleNextStep}>
                    Weiter
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Owner Information */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Ihre Informationen</CardTitle>
                </div>
                <CardDescription>
                  Informationen über den Geschäftsinhaber
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={ownerForm.handleSubmit(() => handleNextStep())} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ownerName">Name</Label>
                      <Input
                        id="ownerName"
                        {...ownerForm.register('name')}
                        placeholder="Max Muster"
                      />
                      {ownerForm.formState.errors.name && (
                        <p className="text-sm text-destructive mt-1">
                          {ownerForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="ownerEmail">E-Mail</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        {...ownerForm.register('email')}
                        placeholder="max@beispiel.ch"
                      />
                      {ownerForm.formState.errors.email && (
                        <p className="text-sm text-destructive mt-1">
                          {ownerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ownerPhone">Telefon</Label>
                    <Input
                      id="ownerPhone"
                      type="tel"
                      {...ownerForm.register('phone')}
                      placeholder="+41 79 123 45 67"
                    />
                    {ownerForm.formState.errors.phone && (
                      <p className="text-sm text-destructive mt-1">
                        {ownerForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canPerformServices"
                      checked={ownerForm.watch('canPerformServices')}
                      onCheckedChange={(checked) => 
                        ownerForm.setValue('canPerformServices', checked as boolean)
                      }
                    />
                    <Label htmlFor="canPerformServices">
                      Ich führe selbst Dienstleistungen durch
                    </Label>
                  </div>

                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p>Als Inhaber haben Sie automatisch vollen Zugriff auf alle Funktionen.</p>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePreviousStep}>
                      Zurück
                    </Button>
                    <Button type="submit">
                      Weiter
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* Step 4: Additional Employee */}
          {currentStep === 4 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Mitarbeiter hinzufügen</CardTitle>
                </div>
                <CardDescription>
                  Möchten Sie einen weiteren Mitarbeiter hinzufügen?
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!skipEmployee ? (
                  <form onSubmit={employeeForm.handleSubmit(() => handleNextStep())} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employeeName">Name</Label>
                        <Input
                          id="employeeName"
                          {...employeeForm.register('name')}
                          placeholder="Anna Muster"
                        />
                        {employeeForm.formState.errors.name && (
                          <p className="text-sm text-destructive mt-1">
                            {employeeForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="employeeEmail">E-Mail</Label>
                        <Input
                          id="employeeEmail"
                          type="email"
                          {...employeeForm.register('email')}
                          placeholder="anna@beispiel.ch"
                        />
                        {employeeForm.formState.errors.email && (
                          <p className="text-sm text-destructive mt-1">
                            {employeeForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="employeePhone">Telefon</Label>
                      <Input
                        id="employeePhone"
                        type="tel"
                        {...employeeForm.register('phone')}
                        placeholder="+41 79 123 45 67"
                      />
                      {employeeForm.formState.errors.phone && (
                        <p className="text-sm text-destructive mt-1">
                          {employeeForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="employeeCanPerform"
                        checked={employeeForm.watch('canPerformServices')}
                        onCheckedChange={(checked) => 
                          employeeForm.setValue('canPerformServices', checked as boolean)
                        }
                      />
                      <Label htmlFor="employeeCanPerform">
                        Kann Dienstleistungen durchführen
                      </Label>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={handlePreviousStep}>
                        Zurück
                      </Button>
                      <div className="space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSkipEmployee(true)
                            handleNextStep()
                          }}
                        >
                          Überspringen
                        </Button>
                        <Button type="submit">
                          Weiter
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Sie haben diesen Schritt übersprungen.
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" onClick={() => setSkipEmployee(false)}>
                        Mitarbeiter hinzufügen
                      </Button>
                      <Button onClick={handleNextStep}>
                        Weiter
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}

          {/* Step 5: Service */}
          {currentStep === 5 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Erste Dienstleistung</CardTitle>
                </div>
                <CardDescription>
                  Erstellen Sie Ihre erste Dienstleistung
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!skipService ? (
                  <form onSubmit={serviceForm.handleSubmit(async () => {
                    await handleNextStep()
                  })} className="space-y-4">
                    <div>
                      <Label htmlFor="serviceName">Name der Dienstleistung</Label>
                      <Input
                        id="serviceName"
                        {...serviceForm.register('name')}
                        placeholder="z.B. Haarschnitt"
                      />
                      {serviceForm.formState.errors.name && (
                        <p className="text-sm text-destructive mt-1">
                          {serviceForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Dauer</Label>
                        <select
                          id="duration"
                          {...serviceForm.register('duration', { valueAsNumber: true })}
                          className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
                        >
                          {SERVICE_DURATIONS.map(duration => (
                            <option key={duration.value} value={duration.value}>
                              {duration.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="price">Preis (CHF)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          {...serviceForm.register('price', { valueAsNumber: true })}
                          placeholder="29.90"
                        />
                        {serviceForm.formState.errors.price && (
                          <p className="text-sm text-destructive mt-1">
                            {serviceForm.formState.errors.price.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="bufferBefore">Puffer vorher (Min.)</Label>
                          <FormTooltip content="Zeit zwischen zwei Terminen für Vorbereitung" />
                        </div>
                        <Input
                          id="bufferBefore"
                          type="number"
                          {...serviceForm.register('bufferBefore', { valueAsNumber: true })}
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="bufferAfter">Puffer nachher (Min.)</Label>
                          <FormTooltip content="Zeit nach dem Termin für Aufräumen oder Nachbereitung" />
                        </div>
                        <Input
                          id="bufferAfter"
                          type="number"
                          {...serviceForm.register('bufferAfter', { valueAsNumber: true })}
                          placeholder="5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Beschreibung (optional)</Label>
                      <Textarea
                        id="description"
                        {...serviceForm.register('description')}
                        placeholder="Beschreiben Sie die Dienstleistung..."
                        rows={3}
                      />
                    </div>

                    <div className="bg-muted p-3 rounded-md text-sm">
                      <p>Diese Dienstleistung wird automatisch allen Mitarbeitern zugewiesen, die Dienstleistungen durchführen können.</p>
                    </div>

                    {/* Hidden field for employeeIds */}
                    <input
                      type="hidden"
                      {...serviceForm.register('employeeIds')}
                    />

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={handlePreviousStep}>
                        Zurück
                      </Button>
                      <div className="space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            setSkipService(true)
                            await handleSubmit(undefined)
                          }}
                        >
                          Überspringen
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Wird erstellt...' : 'Fertigstellen'}
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Sie können später Dienstleistungen hinzufügen.
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" onClick={() => setSkipService(false)}>
                        Dienstleistung erstellen
                      </Button>
                      <Button onClick={() => handleSubmit(undefined)} disabled={isSubmitting}>
                        {isSubmitting ? 'Wird erstellt...' : 'Fertigstellen'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}