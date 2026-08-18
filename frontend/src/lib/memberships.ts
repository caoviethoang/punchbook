import { apiBaseUrl } from "./auth"
import { authHeaders, parseApiResponse } from "./api"

export interface MembershipPackage {
  id: string
  name: string
}

export interface BaseMembership {
  id: string
  customer_name: string
  phone: string
  sessions_left: number | null
  expires_at: string | null
  package: MembershipPackage
}

export interface Membership extends BaseMembership {}

export interface CheckInRecord {
  id: string
  checked_in_at: string
}

export interface CheckInResult {
  membership: Membership
  check_in: CheckInRecord
}

/** True when the member has no sessions left or the day-based pass is past expires_at. */
export function isMembershipExhausted(
  membership: Pick<BaseMembership, "sessions_left" | "expires_at">,
): boolean {
  if (membership.sessions_left === 0) return true
  if (membership.expires_at && new Date(membership.expires_at) < new Date()) {
    return true
  }
  return false
}

/** GET /memberships?query=... — shop-scoped search (blank query returns limited list). */
export async function searchMemberships(query: string): Promise<Membership[]> {
  const params = new URLSearchParams()
  const trimmed = query.trim()
  if (trimmed) {
    params.set("query", trimmed)
  }

  const qs = params.toString()
  const response = await fetch(
    `${apiBaseUrl}/memberships${qs ? `?${qs}` : ""}`,
    { headers: authHeaders() },
  )
  const body = await parseApiResponse<{ memberships: Membership[] }>(response)
  return body.memberships
}

export interface CreateMembershipPayload {
  customer_name: string
  phone: string
  package_id: string
}

/** POST /memberships — create member; backend inits sessions_left / expires_at from package. */
export async function createMembership(
  payload: CreateMembershipPayload,
): Promise<Membership> {
  const response = await fetch(`${apiBaseUrl}/memberships`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ membership: payload }),
  })
  const body = await parseApiResponse<{ membership: Membership }>(response)
  return body.membership
}

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
  const response = await fetch(
    `${apiBaseUrl}/memberships/${membershipId}/invoices`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        invoice: amount ? { amount } : {},
      }),
    },
  )
  return parseApiResponse<PayosInvoiceResult>(response)
}

/**
 * POST /memberships/:id/check_in
 * staffId is required — shop JWT has no staff identity yet (see backend MembershipsController).
 */
export async function checkIn(
  id: string,
  staffId: string,
): Promise<CheckInResult> {
  const response = await fetch(`${apiBaseUrl}/memberships/${id}/check_in`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ staff_id: staffId }),
  })
  return parseApiResponse<CheckInResult>(response)
}
