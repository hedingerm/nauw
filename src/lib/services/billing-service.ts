import { createClient } from "@/src/lib/supabase/client"
import { Tables, TablesInsert } from "@/src/lib/supabase/database.types"

export type Invoice = Tables<"Invoice">
export type CreateInvoiceInput = Omit<TablesInsert<"Invoice">, "id" | "created_at" | "updated_at">

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export class BillingService {
  // Create an invoice
  static async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("Invoice")
      .insert(input)
      .select()
      .single()

    if (error) {
      console.error("Error creating invoice:", error)
      throw new Error("Fehler beim Erstellen der Rechnung")
    }

    return data
  }

  // Get invoices for a business
  static async getBusinessInvoices(
    businessId: string,
    status?: string
  ): Promise<Invoice[]> {
    const supabase = createClient()
    let query = supabase
      .from("Invoice")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching invoices:", error)
      throw new Error("Fehler beim Laden der Rechnungen")
    }

    return data || []
  }

  // Get a specific invoice
  static async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("Invoice")
      .select("*")
      .eq("id", invoiceId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return null
      }
      console.error("Error fetching invoice:", error)
      throw new Error("Fehler beim Laden der Rechnung")
    }

    return data
  }

  // Update invoice status
  static async updateInvoiceStatus(
    invoiceId: string,
    status: string,
    paidAt?: string
  ): Promise<Invoice> {
    const updates: any = { status }
    
    if (status === "paid" && paidAt) {
      updates.paid_at = paidAt
      updates.amount_paid = await this.getInvoiceTotal(invoiceId)
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("Invoice")
      .update(updates)
      .eq("id", invoiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating invoice status:", error)
      throw new Error("Fehler beim Aktualisieren des Rechnungsstatus")
    }

    return data
  }

  // Get invoice total from line items
  private static async getInvoiceTotal(invoiceId: string): Promise<number> {
    const invoice = await this.getInvoice(invoiceId)
    if (!invoice) return 0

    const lineItems = invoice.line_items as unknown as InvoiceLineItem[]
    return lineItems.reduce((total, item) => total + item.amount, 0)
  }

  // Generate invoice number
  static generateInvoiceNumber(businessId: string): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const timestamp = Date.now().toString().slice(-6)
    
    return `INV-${year}${month}-${timestamp}`
  }

  // Create invoice line items
  static createLineItems(items: {
    subscription?: { description: string; amount: number }
    overage?: { quantity: number; unitPrice: number }
    booster?: { quantity: number; unitPrice: number }
  }): InvoiceLineItem[] {
    const lineItems: InvoiceLineItem[] = []

    if (items.subscription) {
      lineItems.push({
        description: items.subscription.description,
        quantity: 1,
        unit_price: items.subscription.amount,
        amount: items.subscription.amount
      })
    }

    if (items.overage && items.overage.quantity > 0) {
      lineItems.push({
        description: `Zusätzliche Buchungen (${items.overage.quantity} × ${items.overage.unitPrice} CHF)`,
        quantity: items.overage.quantity,
        unit_price: items.overage.unitPrice,
        amount: items.overage.quantity * items.overage.unitPrice
      })
    }

    if (items.booster && items.booster.quantity > 0) {
      lineItems.push({
        description: `Booster Pack (${items.booster.quantity} Buchungen)`,
        quantity: 1,
        unit_price: items.booster.unitPrice,
        amount: items.booster.unitPrice
      })
    }

    return lineItems
  }

  // Get unpaid invoices count
  static async getUnpaidInvoicesCount(businessId: string): Promise<number> {
    const supabase = createClient()
    const { count, error } = await supabase
      .from("Invoice")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "open")

    if (error) {
      console.error("Error counting unpaid invoices:", error)
      return 0
    }

    return count || 0
  }

  // Get total outstanding amount
  static async getOutstandingAmount(businessId: string): Promise<number> {
    const invoices = await this.getBusinessInvoices(businessId, "open")
    
    return invoices.reduce((total, invoice) => {
      const amountDue = invoice.amount_total - (invoice.amount_paid || 0)
      return total + amountDue
    }, 0)
  }

  // Update business billing info
  static async updateBillingInfo(
    businessId: string,
    billingInfo: {
      billing_email?: string
      payment_method_last4?: string
      payment_method_brand?: string
    }
  ): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from("Business")
      .update(billingInfo)
      .eq("id", businessId)

    if (error) {
      console.error("Error updating billing info:", error)
      throw new Error("Fehler beim Aktualisieren der Rechnungsinformationen")
    }
  }
}
