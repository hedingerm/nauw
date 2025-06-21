'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Download, Copy, Check } from 'lucide-react'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  businessName: string
}

export function QRCodeDialog({ open, onOpenChange, url, businessName }: QRCodeDialogProps) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const handleDownload = () => {
    if (!qrRef.current) return

    // Find the SVG element
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    // Get SVG string
    const svgData = new XMLSerializer().serializeToString(svg)
    
    // Create a canvas element
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size (add padding for white border)
    const padding = 40
    const size = 256 + (padding * 2)
    canvas.width = size
    canvas.height = size

    // Create an image from SVG
    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    img.onload = () => {
      // Fill white background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, size, size)
      
      // Draw the QR code
      ctx.drawImage(img, padding, padding, 256, 256)
      
      // Convert to PNG and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${businessName.toLowerCase().replace(/\s+/g, '-')}-qr-code.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          toast.success('QR-Code heruntergeladen')
        }
      }, 'image/png')
      
      URL.revokeObjectURL(svgUrl)
    }

    img.src = svgUrl
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link kopiert')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Fehler beim Kopieren')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR-Code für Ihre Buchungsseite</DialogTitle>
          <DialogDescription>
            Scannen Sie diesen Code oder laden Sie ihn für Ihre Marketingmaterialien herunter
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6">
          {/* QR Code Container */}
          <div 
            ref={qrRef}
            className="bg-white p-8 rounded-lg shadow-lg"
            style={{ backgroundColor: 'white' }}
          >
            <QRCode
              value={url}
              size={256}
              level="H"
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          </div>

          {/* Business Name */}
          <div className="text-center space-y-2">
            <p className="font-semibold text-lg">{businessName}</p>
            <p className="text-sm text-muted-foreground break-all max-w-sm">
              {url}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleDownload}
              className="flex-1"
              variant="default"
            >
              <Download className="mr-2 h-4 w-4" />
              Herunterladen
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Kopiert
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Link kopieren
                </>
              )}
            </Button>
          </div>

          {/* Usage Tips */}
          <div className="w-full rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Verwendungstipps:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Drucken Sie den QR-Code auf Visitenkarten</li>
              <li>• Fügen Sie ihn zu Flyern und Broschüren hinzu</li>
              <li>• Zeigen Sie ihn in Ihrem Geschäft an</li>
              <li>• Teilen Sie ihn in sozialen Medien</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}