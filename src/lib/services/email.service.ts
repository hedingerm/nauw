import * as React from 'react'
import { Resend } from 'resend'
import { UsageWarningEmail } from '@/src/components/emails/usage-warning-email'
import { UsageCriticalEmail } from '@/src/components/emails/usage-critical-email'
import { PaymentFailedEmail } from '@/src/components/emails/payment-failed-email'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailParams {
  to: string
  subject: string
  type: 'usage_warning' | 'usage_critical' | 'payment_failed'
  data: {
    businessName: string
    appUrl: string
    // For usage emails
    used?: number
    total?: number
    percentage?: number
    remaining?: number
    // For payment failed
    invoiceAmount?: number
  }
}

export class EmailService {
  static async sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
      const { to, subject, type, data } = params
      
      // Select the appropriate email template based on type
      let emailComponent: React.ReactElement
      
      switch (type) {
        case 'usage_warning':
          if (!data.used || !data.total || !data.percentage || !data.remaining) {
            throw new Error('Missing required data for usage warning email')
          }
          emailComponent = UsageWarningEmail({
            businessName: data.businessName,
            used: data.used,
            total: data.total,
            percentage: data.percentage,
            remaining: data.remaining,
            appUrl: data.appUrl
          }) as React.ReactElement
          break
          
        case 'usage_critical':
          if (!data.used || !data.total || !data.percentage || !data.remaining) {
            throw new Error('Missing required data for usage critical email')
          }
          emailComponent = UsageCriticalEmail({
            businessName: data.businessName,
            used: data.used,
            total: data.total,
            percentage: data.percentage,
            remaining: data.remaining,
            appUrl: data.appUrl
          }) as React.ReactElement
          break
          
        case 'payment_failed':
          if (!data.invoiceAmount) {
            throw new Error('Missing invoice amount for payment failed email')
          }
          emailComponent = PaymentFailedEmail({
            businessName: data.businessName,
            invoiceAmount: data.invoiceAmount,
            appUrl: data.appUrl
          }) as React.ReactElement
          break
          
        default:
          throw new Error(`Unknown email type: ${type}`)
      }
      
      // Send email using Resend
      const result = await resend.emails.send({
        from: 'nauw <noreply@nauw.ch>',
        to: [to],
        subject,
        react: emailComponent
      })
      
      if (result.error) {
        console.error('Resend error:', result.error)
        return { success: false, error: result.error.message }
      }
      
      return { success: true }
      
    } catch (error) {
      console.error('Error sending email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim E-Mail-Versand'
      }
    }
  }
  
  // Convenience methods for specific email types
  static async sendUsageWarningEmail(
    to: string,
    businessName: string,
    usage: { used: number; total: number; percentage: number; remaining: number }
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to,
      subject: '⚠️ Warnung: Ihr Buchungskontingent läuft aus',
      type: 'usage_warning',
      data: {
        businessName,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        ...usage
      }
    })
  }
  
  static async sendUsageCriticalEmail(
    to: string,
    businessName: string,
    usage: { used: number; total: number; percentage: number; remaining: number }
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to,
      subject: '🚨 Kritisch: Buchungskontingent fast aufgebraucht!',
      type: 'usage_critical',
      data: {
        businessName,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        ...usage
      }
    })
  }
  
  static async sendPaymentFailedEmail(
    to: string,
    businessName: string,
    invoiceAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to,
      subject: '❌ Zahlung fehlgeschlagen',
      type: 'payment_failed',
      data: {
        businessName,
        invoiceAmount,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
    })
  }
}