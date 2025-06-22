import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/src/lib/stripe/config'
import { createServiceRoleClient } from '@/src/lib/supabase/server'
import { createClient } from '@/src/lib/supabase/client'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the business for this user
    const { data: business } = await supabase
      .from('Business')
      .select('id, stripe_customer_id')
      .eq('userId', user.id)
      .single()

    if (!business || !business.stripe_customer_id) {
      return NextResponse.json({ error: 'Business or Stripe customer not found' }, { status: 404 })
    }

    // Use service role client for the sync
    const serviceSupabase = createServiceRoleClient()

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: business.stripe_customer_id,
      limit: 100, // Adjust as needed
    })

    console.log(`Found ${invoices.data.length} invoices to sync for business ${business.id}`)

    let syncedCount = 0
    let errorCount = 0

    for (const invoice of invoices.data) {
      try {
        // Skip draft invoices
        if (invoice.status === 'draft') {
          console.log(`Skipping draft invoice ${invoice.id}`)
          continue
        }

        // Prepare invoice data
        const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string }
        
        // Safe period date handling
        let periodStart: string
        let periodEnd: string
        
        if (invoice.period_start) {
          periodStart = new Date(invoice.period_start * 1000).toISOString()
        } else {
          periodStart = new Date(invoice.created * 1000).toISOString()
        }
        
        if (invoice.period_end) {
          periodEnd = new Date(invoice.period_end * 1000).toISOString()
        } else {
          const startDate = new Date(periodStart)
          periodEnd = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }

        const invoiceData = {
          business_id: business.id,
          stripe_invoice_id: invoice.id,
          invoice_number: invoice.number || `INV-${invoice.created}`,
          status: invoice.status === 'paid' ? 'paid' : 'open',
          amount_total: (invoice.total / 100), // Convert from cents
          amount_paid: invoice.status === 'paid' ? (invoice.amount_paid / 100) : 0,
          currency: invoice.currency.toUpperCase(),
          period_start: periodStart,
          period_end: periodEnd,
          paid_at: invoice.status === 'paid' && invoice.status_transitions?.paid_at 
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() 
            : null,
          due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
          payment_method_type: 'card', // Default, could be enhanced
          line_items: invoice.lines.data.map((line: any) => ({
            description: line.description || '',
            quantity: line.quantity || 1,
            unit_price: line.unit_amount ? line.unit_amount / 100 : 0,
            amount: line.amount / 100
          })),
          metadata: invoice.metadata || {},
          subscription_id: invoiceWithSubscription.subscription 
            ? (await serviceSupabase
                .from('Subscription')
                .select('id')
                .eq('stripe_subscription_id', invoiceWithSubscription.subscription)
                .single()
              ).data?.id || null
            : null
        }

        // Check if invoice already exists
        const { data: existingInvoice } = await serviceSupabase
          .from('Invoice')
          .select('id')
          .eq('stripe_invoice_id', invoice.id)
          .single()

        if (existingInvoice) {
          // Update existing invoice
          const { error: updateError } = await serviceSupabase
            .from('Invoice')
            .update(invoiceData)
            .eq('id', existingInvoice.id)
          
          if (updateError) {
            console.error(`Error updating invoice ${invoice.id}:`, updateError)
            errorCount++
          } else {
            console.log(`Updated invoice ${invoice.id}`)
            syncedCount++
          }
        } else {
          // Create new invoice
          const { error: insertError } = await serviceSupabase
            .from('Invoice')
            .insert(invoiceData)
          
          if (insertError) {
            console.error(`Error creating invoice ${invoice.id}:`, insertError)
            errorCount++
          } else {
            console.log(`Created invoice ${invoice.id}`)
            syncedCount++
          }
        }
      } catch (error) {
        console.error(`Error processing invoice ${invoice.id}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} invoices successfully`,
      syncedCount,
      errorCount,
      totalFound: invoices.data.length
    })
  } catch (error) {
    console.error('Invoice sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync invoices' },
      { status: 500 }
    )
  }
}