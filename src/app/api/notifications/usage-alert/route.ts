import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/src/lib/services/notification.service'

export async function POST(request: NextRequest) {
  try {
    // Verify this is being called by our Edge Function
    const authHeader = request.headers.get('authorization')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!authHeader || !authHeader.includes(serviceRoleKey!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse request body
    const body = await request.json()
    const { business_id, type, percentage, used, total } = body
    
    // Validate input
    if (!business_id || !type || percentage === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Send the usage alert
    await NotificationService.sendUsageAlert(business_id, percentage)
    
    return NextResponse.json({
      success: true,
      message: `${type} alert sent for business ${business_id}`
    })
    
  } catch (error) {
    console.error('Usage alert API error:', error)
    return NextResponse.json(
      { error: 'Failed to send usage alert' },
      { status: 500 }
    )
  }
}