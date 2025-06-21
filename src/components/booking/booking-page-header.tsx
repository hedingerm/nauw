'use client'

import { cn } from '@/src/lib/utils/cn'
import type { Database } from '@/src/lib/supabase/database.types'
import type { BookingPageConfig } from '@/src/lib/types/booking-config'

type Business = Database['public']['Tables']['Business']['Row']

interface BookingPageHeaderProps {
  business: Business
  config: BookingPageConfig | null
}

export function BookingPageHeader({ business, config }: BookingPageHeaderProps) {
  return (
    <>
      {/* Header with Cover Image and Logo */}
      {(config?.logoUrl || config?.coverImageUrl) && (
        <div className="relative mb-8">
          {/* Cover Image */}
          {config.coverImageUrl && (
            <div className="h-48 md:h-64 bg-cover bg-center relative" style={{ backgroundImage: `url(${config.coverImageUrl})` }}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
            </div>
          )}
          
          {/* Logo - Centered and visible over cover */}
          {config.logoUrl && (
            <div className={cn(
              "flex justify-center",
              config.coverImageUrl ? "absolute inset-0 items-center" : "py-8"
            )}>
              <div className={cn(
                "p-4 rounded-lg",
                config.coverImageUrl ? "bg-white/90 backdrop-blur-sm shadow-lg" : ""
              )}>
                <img 
                  src={config.logoUrl} 
                  alt={business.name} 
                  className="h-20 md:h-24 object-contain max-w-[200px]"
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Business Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: config?.theme.primaryColor }}>
          {config?.content.welcomeTitle || business.name}
        </h1>
        {config?.content.welcomeText ? (
          <p className="text-lg opacity-80 mb-4">{config.content.welcomeText}</p>
        ) : business.description && (
          <p className="text-muted-foreground mb-4">{business.description}</p>
        )}
      </div>
    </>
  )
}