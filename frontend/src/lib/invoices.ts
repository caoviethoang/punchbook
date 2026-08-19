import { apiPost } from "./api"

export interface Invoice {
  id: string
  membership_id: string
  amount: number
  status: "pending" | "paid" | "cancelled"
  payos_transaction_id: string | null
  payos_checkout_url: string | null
  created_at: string
}

export interface PayosInvoiceResult {
  invoice: Invoice
  payos: {
    checkout_url: string
    qr_code?: string
  }
}

/**
 * POST /memberships/:id/invoices
 * Creates a pending invoice and returns payOS checkout URL + QR code.
 */
export async function createInvoice(
  membershipId: string,
  amount?: number,
): Promise<PayosInvoiceResult> {
  return apiPost<PayosInvoiceResult>(`/memberships/${membershipId}/invoices`, {
    invoice: amount ? { amount } : {},
  })
}
