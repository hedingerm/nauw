'use client'

import { Check, Calendar, User, ShoppingBag } from 'lucide-react'
import { cn } from '@/src/lib/utils/cn'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'

type BookingStep = 'service' | 'datetime' | 'customer'

interface StepIndicatorProps {
  currentStep: BookingStep
  bookingConfirmed: boolean
  config: BookingPageConfig | null
}

interface Step {
  id: BookingStep
  number: string
  label: string
  icon: React.ReactNode
}

const steps: Step[] = [
  { id: 'service', number: '1', label: 'Service', icon: <ShoppingBag className="h-4 w-4" /> },
  { id: 'datetime', number: '2', label: 'Termin', icon: <Calendar className="h-4 w-4" /> },
  { id: 'customer', number: '3', label: 'Kontakt', icon: <User className="h-4 w-4" /> }
]

export function StepIndicator({ currentStep, bookingConfirmed, config }: StepIndicatorProps) {
  const getStepState = (stepId: BookingStep) => {
    const stepIndex = steps.findIndex(s => s.id === stepId)
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    
    if (bookingConfirmed || currentIndex > stepIndex) {
      return 'completed'
    } else if (currentIndex === stepIndex) {
      return 'active'
    } else {
      return 'inactive'
    }
  }

  const primaryColor = config?.theme.primaryColor || '#2563eb'
  const secondaryColor = config?.theme.secondaryColor || '#64748b'

  return (
    <div className="mb-8 px-4">
      {/* Mobile view - simplified */}
      <div className="flex items-center justify-between sm:hidden">
        {steps.map((step, index) => {
          const state = getStepState(step.id)
          const isLast = index === steps.length - 1
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "rounded-full h-10 w-10 flex items-center justify-center transition-all duration-300",
                    state === 'completed' && "bg-primary text-white shadow-lg",
                    state === 'active' && "bg-primary/10 text-primary ring-2 ring-primary ring-offset-2",
                    state === 'inactive' && "bg-gray-100 text-gray-400"
                  )}
                  style={{
                    backgroundColor: state === 'completed' ? primaryColor : 
                                   state === 'active' ? `${primaryColor}1a` : undefined,
                    color: state === 'completed' ? 'white' : 
                          state === 'active' ? primaryColor : undefined,
                    borderColor: state === 'active' ? primaryColor : undefined
                  }}
                >
                  {state === 'completed' ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span 
                  className={cn(
                    "text-xs mt-1 font-medium",
                    state === 'active' && "text-primary",
                    state === 'inactive' && "text-gray-400"
                  )}
                  style={{
                    color: state === 'active' ? primaryColor : undefined
                  }}
                >
                  {step.label}
                </span>
              </div>
              
              {!isLast && (
                <div 
                  className={cn(
                    "flex-1 h-0.5 -mt-4 mx-1 transition-all duration-300",
                    state === 'completed' && "bg-primary",
                    state !== 'completed' && "bg-gray-200"
                  )}
                  style={{
                    backgroundColor: state === 'completed' ? primaryColor : undefined
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop view - enhanced */}
      <div className="hidden sm:flex items-center justify-center">
        <div className="flex items-center">
          {steps.map((step, index) => {
            const state = getStepState(step.id)
            const isLast = index === steps.length - 1
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="relative flex flex-col items-center">
                  {/* Step circle with icon */}
                  <div 
                    className={cn(
                      "rounded-full h-12 w-12 flex items-center justify-center transition-all duration-300 relative",
                      state === 'completed' && "bg-primary text-white shadow-lg scale-105",
                      state === 'active' && "bg-primary/10 text-primary ring-2 ring-primary ring-offset-2 scale-110",
                      state === 'inactive' && "bg-gray-100 text-gray-400 border-2 border-gray-200"
                    )}
                    style={{
                      backgroundColor: state === 'completed' ? primaryColor : 
                                     state === 'active' ? `${primaryColor}1a` : undefined,
                      color: state === 'completed' ? 'white' : 
                            state === 'active' ? primaryColor : undefined,
                      borderColor: state === 'active' ? primaryColor : undefined
                    }}
                  >
                    {state === 'completed' ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        {step.icon}
                      </div>
                    )}
                    
                    {/* Active pulse animation */}
                    {state === 'active' && (
                      <div 
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                          backgroundColor: `${primaryColor}20`
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Step label */}
                  <div className="mt-2 text-center">
                    <span 
                      className={cn(
                        "text-sm font-semibold block",
                        state === 'active' && "text-primary",
                        state === 'completed' && "text-gray-700",
                        state === 'inactive' && "text-gray-400"
                      )}
                      style={{
                        color: state === 'active' ? primaryColor : undefined
                      }}
                    >
                      {step.label}
                    </span>
                    <span 
                      className={cn(
                        "text-xs",
                        state === 'active' && "text-primary/70",
                        state === 'completed' && "text-gray-500",
                        state === 'inactive' && "text-gray-400"
                      )}
                      style={{
                        color: state === 'active' ? `${primaryColor}b3` : undefined
                      }}
                    >
                      Schritt {step.number}
                    </span>
                  </div>
                </div>
                
                {/* Connector line */}
                {!isLast && (
                  <div className="w-16 lg:w-24 px-2">
                    <div 
                      className={cn(
                        "h-1 rounded-full transition-all duration-500",
                        getStepState(steps[index + 1].id) !== 'inactive' && "bg-primary",
                        getStepState(steps[index + 1].id) === 'inactive' && "bg-gray-200"
                      )}
                      style={{
                        backgroundColor: getStepState(steps[index + 1].id) !== 'inactive' ? primaryColor : undefined
                      }}
                    >
                      {/* Progress animation for active transitions */}
                      {state === 'completed' && getStepState(steps[index + 1].id) === 'active' && (
                        <div 
                          className="h-full rounded-full animate-pulse"
                          style={{
                            backgroundColor: primaryColor,
                            opacity: 0.6
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}