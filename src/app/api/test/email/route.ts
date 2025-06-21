import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/src/lib/services/email-service'
import { createClient } from '@/src/lib/supabase/server'

// Test endpoint for email functionality (remove in production)
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
    }
    
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse request body
    const body = await request.json()
    const { type = 'usage_warning', email } = body
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    
    // Send test email based on type
    let result
    const testData = {
      businessName: 'Test Business',
      used: 80,
      total: 100,
      percentage: 80,
      remaining: 20,
      invoiceAmount: 49.00
    }
    
    switch (type) {
      case 'usage_warning':
        result = await EmailService.sendUsageWarningEmail(
          email,
          testData.businessName,
          {
            used: testData.used,
            total: testData.total,
            percentage: testData.percentage,
            remaining: testData.remaining
          }
        )
        break
        
      case 'usage_critical':
        result = await EmailService.sendUsageCriticalEmail(
          email,
          testData.businessName,
          {
            used: 95,
            total: 100,
            percentage: 95,
            remaining: 5
          }
        )
        break
        
      case 'payment_failed':
        result = await EmailService.sendPaymentFailedEmail(
          email,
          testData.businessName,
          testData.invoiceAmount
        )
        break
        
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }
    
    return NextResponse.json({
      success: result.success,
      error: result.error,
      message: result.success 
        ? `Test ${type} email sent to ${email}` 
        : `Failed to send email: ${result.error}`
    })
    
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}