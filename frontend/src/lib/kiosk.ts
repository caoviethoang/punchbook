import { parseApiResponse, resolveApiUrl } from "./api"
import type { Membership } from "./memberships"

const KIOSK_TOKEN_KEY = "punchbook_kiosk_token"

export interface KioskShopConfig {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  bank_name?: string | null
  bank_account_no?: string | null
  bank_account_name?: string | null
}

export interface KioskConfig {
  shop: KioskShopConfig
  kiosk: {
    enabled?: boolean
    welcome_message: string
    audio_enabled: boolean
    camera_enabled: boolean
    auto_reset_seconds: number
  }
}

export interface KioskRenewalPayload {
  invoice_id: string
  order_code?: number | null
  amount: number
  package_name: string
  description?: string | null
  bank_name?: string | null
  bank_account_no?: string | null
  bank_account_name?: string | null
  vietqr_url?: string | null
  payos_checkout_url?: string | null
}

export interface KioskCheckInResult {
  status: "success" | "denied"
  code?: string
  message: string
  audio_text?: string
  membership?: Membership
  check_in?: { id: string; checked_in_at: string }
  milestone_reached?: number | null
  renewal?: KioskRenewalPayload | null
}

export interface KioskLoginResponse {
  kiosk_token: string
  shop: {
    id: string
    name: string
    address?: string | null
    phone?: string | null
  }
}

export interface KioskInvoiceStatusResponse {
  id: string
  status: "pending" | "paid" | "cancelled"
  membership_id: string
  paid_at?: string | null
}

export function getStoredKioskToken(): string | null {
  try {
    return localStorage.getItem(KIOSK_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredKioskToken(token: string): void {
  try {
    localStorage.setItem(KIOSK_TOKEN_KEY, token)
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredKioskToken(): void {
  try {
    localStorage.removeItem(KIOSK_TOKEN_KEY)
  } catch {
    // Ignore storage errors
  }
}

function kioskHeaders(customToken?: string): HeadersInit {
  const token = customToken || getStoredKioskToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { "X-Kiosk-Token": token } : {}),
  }
}

export async function loginKiosk(pin: string, shopIdOrEmail?: string): Promise<KioskLoginResponse> {
  const payload: Record<string, string> = { pin }
  if (shopIdOrEmail) {
    if (shopIdOrEmail.includes("@")) {
      payload.email = shopIdOrEmail
    } else {
      payload.shop_id = shopIdOrEmail
    }
  }

  const res = await fetch(resolveApiUrl("/kiosk/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = await parseApiResponse<KioskLoginResponse>(res)
  if (data.kiosk_token) {
    setStoredKioskToken(data.kiosk_token)
  }
  return data
}

export async function fetchKioskConfig(customToken?: string): Promise<KioskConfig> {
  const res = await fetch(resolveApiUrl("/kiosk/config"), {
    method: "GET",
    headers: kioskHeaders(customToken),
  })

  return parseApiResponse<KioskConfig>(res)
}

export async function kioskCheckIn(
  identifier: string,
  customToken?: string,
): Promise<KioskCheckInResult> {
  const res = await fetch(resolveApiUrl("/kiosk/check_in"), {
    method: "POST",
    headers: kioskHeaders(customToken),
    body: JSON.stringify({ identifier }),
  })

  return parseApiResponse<KioskCheckInResult>(res)
}

export async function checkKioskInvoiceStatus(
  invoiceId: string,
  customToken?: string,
): Promise<KioskInvoiceStatusResponse> {
  const res = await fetch(resolveApiUrl(`/kiosk/invoices/${encodeURIComponent(invoiceId)}/status`), {
    method: "GET",
    headers: kioskHeaders(customToken),
  })

  return parseApiResponse<KioskInvoiceStatusResponse>(res)
}
