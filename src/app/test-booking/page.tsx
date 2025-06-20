'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BusinessService } from '@/src/lib/services/business.service'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'

export default function TestBookingPage() {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBusinesses()
  }, [])

  const loadBusinesses = async () => {
    try {
      // For testing, we'll try to get the current business
      const business = await BusinessService.getCurrentBusiness()
      if (business) {
        setBusinesses([business])
      }
    } catch (error) {
      console.error('Error loading businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Customer Booking</CardTitle>
          <CardDescription>
            Wählen Sie ein Unternehmen aus, um die Kundenbuchung zu testen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <p className="text-muted-foreground">
              Keine Unternehmen gefunden. Bitte erstellen Sie zuerst ein Unternehmen.
            </p>
          ) : (
            <div className="space-y-4">
              {businesses.map((business) => (
                <div key={business.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{business.name}</h3>
                    <p className="text-sm text-muted-foreground">ID: {business.id}</p>
                  </div>
                  <Button asChild>
                    <Link href={`/book/${business.id}`} target="_blank">
                      Buchung testen
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}