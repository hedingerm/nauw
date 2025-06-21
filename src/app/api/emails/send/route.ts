import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/src/lib/services/email-service'
import { createClient } from '@/src/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse request body
    const body = await request.json()
    const { to, type, businessId, data } = body
    
    // Verify user has access to this business
    const { data: business, error: businessError } = await supabase
      .from('Business')
      .select('id, name, email, billing_email')
      .eq('id', businessId)
      .eq('userId', user.id)
      .single()
    
    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }
    
    // Determine email recipient
    const recipient = to || business.billing_email || business.email
    
    // Send email based on type
    let result
    switch (type) {
      case 'usage_warning':
        result = await EmailService.sendUsageWarningEmail(
          recipient,
          business.name,
          data
        )
        break
        
      case 'usage_critical':
        result = await EmailService.sendUsageCriticalEmail(
          recipient,
          business.name,
          data
        )
        break
        
      case 'payment_failed':
        result = await EmailService.sendPaymentFailedEmail(
          recipient,
          business.name,
          data.invoiceAmount
        )
        break
        
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }
    
    // Log notification in database
    if (result.success) {
      await supabase
        .from('Notification')
        .insert({
          business_id: businessId,
          type,
          subject: getSubjectForType(type),
          content: '', // Content is in the email template
          email: recipient,
          sent_at: new Date().toISOString()
        })
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

function getSubjectForType(type: string): string {
  switch (type) {
    case 'usage_warning':
      return '⚠️ Warnung: Ihr Buchungskontingent läuft aus'
    case 'usage_critical':
      return '🚨 Kritisch: Buchungskontingent fast aufgebraucht!'
    case 'payment_failed':
      return '❌ Zahlung fehlgeschlagen'
    default:
      return 'Benachrichtigung von nauw'
  }
}