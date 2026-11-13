import { parseApiResponse, resolveApiUrl } from "./api"

export interface PortalPackage {
  id: string
  name: string
  price: number
  sessions_count: number | null
  duration_days: number | null
}

export interface PortalShop {
  id: string
  name: string
  phone?: string | null
  address?: string | null
  bank_name?: string | null
  bank_account_no?: string | null
  bank_account_name?: string | null
}

export interface PortalMemberProfile {
  id: string
  customer_name: string
  phone: string
  email?: string | null
  status: "active" | "expiring" | "expired" | "frozen" | "transferred" | "deleted"
  sessions_left: number | null
  expires_at: string | null
  qr_code_value: string
  public_token: string
  is_frozen?: boolean
  frozen_until?: string | null
  checked_in_today?: boolean
  last_checked_in_at?: string | null
  assigned_staff?: { id: string; name: string; role?: string } | null
  package: PortalPackage
  shop: PortalShop
}

export interface PortalProfileResponse {
  member: PortalMemberProfile
  available_packages: PortalPackage[]
}

export interface PortalCheckInItem {
  id: string
  checked_in_at: string
}

export interface PortalInvoiceItem {
  id: string
  amount: number
  status: string
  payos_order_code?: number | null
  payos_checkout_url?: string | null
  created_at: string
}

export interface PortalHistoryResponse {
  check_ins: PortalCheckInItem[]
  invoices: PortalInvoiceItem[]
}

export interface PortalRenewResponse {
  invoice: {
    id: string
    amount: number
    status: string
    payos_order_code?: number | null
    payos_checkout_url?: string | null
  }
  payos: {
    checkout_url: string | null
    qr_code: string | null
  }
}

async function portalFetch<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(resolveApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Member-Token": token,
      ...(init.headers || {}),
    },
  })
  return parseApiResponse<T>(response)
}

export function fetchMemberPortalProfile(token: string): Promise<PortalProfileResponse> {
  return portalFetch<PortalProfileResponse>("/member_portal/profile", token)
}

export function fetchMemberPortalHistory(token: string): Promise<PortalHistoryResponse> {
  return portalFetch<PortalHistoryResponse>("/member_portal/history", token)
}

export function renewMemberPortal(token: string, packageId?: string): Promise<PortalRenewResponse> {
  return portalFetch<PortalRenewResponse>("/member_portal/renew", token, {
    method: "POST",
    body: JSON.stringify(packageId ? { package_id: packageId } : {}),
  })
}
