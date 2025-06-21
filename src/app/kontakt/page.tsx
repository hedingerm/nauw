'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import { NavigationHeader } from '@/src/components/features/navigation-header'
import { Footer } from '@/src/components/features/footer'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { Card } from '@/src/components/ui/card'
import { useToast } from '@/src/hooks/use-toast'
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline'

// export const metadata: Metadata = {
//   title: 'Kontakt - nauw',
//   description: 'Kontaktieren Sie uns - nauw Support Team',
// }

export default function KontaktPage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Here you would normally send the form data to your backend
    // For now, we'll just show a success message
    setTimeout(() => {
      toast({
        title: 'Nachricht gesendet',
        description: 'Vielen Dank für Ihre Nachricht. Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
      })
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })
      setIsSubmitting(false)
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      <NavigationHeader />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900">Kontaktieren Sie uns</h1>
            <p className="mt-4 text-lg text-gray-600">
              Haben Sie Fragen? Wir sind für Sie da und helfen Ihnen gerne weiter.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Kontaktinformationen</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPinIcon className="h-6 w-6 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Adresse</p>
                      <p className="text-gray-600">Hedinger-Digital</p>
                      <p className="text-gray-600">Rosgartenstrasse 19</p>
                      <p className="text-gray-600">7205 Zizers</p>
                      <p className="text-gray-600">Schweiz</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <PhoneIcon className="h-6 w-6 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Telefon</p>
                      <p className="text-gray-600">+41 81 511 23 41</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <EnvelopeIcon className="h-6 w-6 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">E-Mail</p>
                      <p className="text-gray-600">support@nauw.ch</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <ClockIcon className="h-6 w-6 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Geschäftszeiten</p>
                      <p className="text-gray-600">Montag - Freitag</p>
                      <p className="text-gray-600">08:00 - 18:00 Uhr</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Support-Antwortzeiten</h3>
                  <p className="text-sm text-gray-600">
                    Wir antworten in der Regel innerhalb von 2-4 Stunden während der 
                    Geschäftszeiten. Kritische Anfragen werden priorisiert behandelt.
                  </p>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Nachricht senden</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">E-Mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject">Betreff *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Nachricht *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">* Pflichtfelder</p>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Vertrieb</h3>
              <p className="text-gray-600">
                Interessiert an nauw? Lassen Sie uns über Ihre Anforderungen sprechen.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Technischer Support</h3>
              <p className="text-gray-600">
                Probleme mit der Software? Unser Support-Team hilft Ihnen gerne.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Partnerschaften</h3>
              <p className="text-gray-600">
                Möchten Sie Partner werden? Kontaktieren Sie uns für Details.
              </p>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}