import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerAdminClient } from '@/src/lib/supabase/route-handler'
import crypto from 'crypto'

// Resend webhook events we care about
type ResendWebhookEvent = {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 'email.bounced' | 'email.complained' | 'email.opened' | 'email.clicked'
  created_at: string
  data: {
    email_id: string
    to: string[]
    from: string
    subject: string
    // Additional fields based on event type
    bounce?: {
      type: string
      message: string
    }
    complaint?: {
      type: string
    }
    click?: {
      link: string
    }
  }
}

// Verify webhook signature from Resend
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    
    // Get signature from headers
    const signature = request.headers.get('resend-signature')
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    
    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // Parse event
    const event: ResendWebhookEvent = JSON.parse(rawBody)
    
    // Initialize Supabase client
    const response = new NextResponse()
    const supabase = createRouteHandlerAdminClient(request, response)
    
    // Handle different event types
    switch (event.type) {
      case 'email.sent':
        // Email was accepted by Resend
        await updateNotificationStatus(
          supabase,
          event.data.to[0],
          event.data.subject,
          'sent',
          null
        )
        break
        
      case 'email.delivered':
        // Email was delivered to recipient
        await updateNotificationStatus(
          supabase,
          event.data.to[0],
          event.data.subject,
          'sent',
          null
        )
        break
        
      case 'email.bounced':
        // Email bounced
        await updateNotificationStatus(
          supabase,
          event.data.to[0],
          event.data.subject,
          'failed',
          `Bounce: ${event.data.bounce?.type} - ${event.data.bounce?.message}`
        )
        break
        
      case 'email.complained':
        // Recipient marked as spam
        await updateNotificationStatus(
          supabase,
          event.data.to[0],
          event.data.subject,
          'failed',
          `Marked as spam by recipient`
        )
        
        // Optionally unsubscribe user from future emails
        await handleComplaint(supabase, event.data.to[0])
        break
        
      case 'email.opened':
      case 'email.clicked':
        // Track engagement (optional)
        // Track email engagement events
        break
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Update notification status in database
async function updateNotificationStatus(
  supabase: any,
  email: string,
  subject: string,
  status: 'sent' | 'failed',
  error: string | null
) {
  try {
    // Find the most recent notification with this email and subject
    const { data: notification } = await supabase
      .from('Notification')
      .select('id')
      .eq('email', email)
      .eq('subject', subject)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (notification) {
      await supabase
        .from('Notification')
        .update({
          status,
          error,
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id)
    }
  } catch (error) {
    console.error('Error updating notification status:', error)
  }
}

// Handle spam complaints by marking user as unsubscribed
async function handleComplaint(supabase: any, email: string) {
  try {
    // Find business with this email
    const { data: businesses } = await supabase
      .from('Business')
      .select('id')
      .or(`email.eq.${email},billing_email.eq.${email}`)
    
    if (businesses && businesses.length > 0) {
      // Mark as unsubscribed from email notifications
      for (const business of businesses) {
        await supabase
          .from('Business')
          .update({
            email_notifications_enabled: false,
            email_unsubscribed_at: new Date().toISOString()
          })
          .eq('id', business.id)
      }
    }
  } catch (error) {
    console.error('Error handling complaint:', error)
  }
}