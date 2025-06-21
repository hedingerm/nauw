import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify this is being called by our cron job or authorized source
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.includes(supabaseServiceKey)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }


    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('Subscription')
      .select(`
        business_id,
        subscription_plans!inner(
          bookings_included
        )
      `)
      .eq('status', 'active')

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`)
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscriptions to check' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }


    const alerts: any[] = []
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

    // Check each subscription
    for (const sub of subscriptions) {
      try {
        // Skip unlimited plans
        if (sub.subscription_plans.bookings_included === -1) {
          continue
        }

        // Get current month usage
        const { data: usage, error: usageError } = await supabase
          .from('Usage')
          .select('bookings_count')
          .eq('business_id', sub.business_id)
          .eq('month', currentMonth)
          .single()

        if (usageError && usageError.code !== 'PGRST116') {
          console.error(`Error fetching usage for ${sub.business_id}:`, usageError)
          continue
        }

        const used = usage?.bookings_count || 0
        const total = sub.subscription_plans.bookings_included
        const percentage = Math.round((used / total) * 100)

        // Check thresholds
        if (percentage >= 95) {
          alerts.push({
            business_id: sub.business_id,
            type: 'usage_critical',
            percentage,
            used,
            total
          })
        } else if (percentage >= 80) {
          alerts.push({
            business_id: sub.business_id,
            type: 'usage_warning',
            percentage,
            used,
            total
          })
        }
      } catch (error) {
        console.error(`Error processing business ${sub.business_id}:`, error)
      }
    }


    // Send alerts via our API
    if (alerts.length > 0) {
      const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'
      
      for (const alert of alerts) {
        try {
          // Call our notification API
          const response = await fetch(`${appUrl}/api/notifications/usage-alert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify(alert)
          })

          if (!response.ok) {
            console.error(`Failed to send alert for ${alert.business_id}:`, await response.text())
          }
        } catch (error) {
          console.error(`Error sending alert for ${alert.business_id}:`, error)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Usage alerts check completed',
        alertsSent: alerts.length,
        alerts
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in check-usage-alerts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})