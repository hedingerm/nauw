import { CheckIcon } from '@heroicons/react/24/solid'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  steps: string[]
}

export function ProgressIndicator({ currentStep, totalSteps, steps }: ProgressIndicatorProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          
          return (
            <div key={step} className="flex items-center">
              <div className="relative">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${isCompleted 
                      ? 'bg-primary text-primary-foreground' 
                      : isActive 
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <div className={`
                  absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap
                  ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}
                `}>
                  {step}
                </div>
              </div>
              {index < totalSteps - 1 && (
                <div className={`
                  w-full h-1 mx-2 
                  ${stepNumber < currentStep ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}