import { apiBaseUrl, getStoredToken } from "./auth"

export interface MembershipPackage {
  id: string
  name: string
}

export interface Membership {
  id: string
  customer_name: string
  phone: string
  sessions_left: number | null
  expires_at: string | null
  package: MembershipPackage
}

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
  membership: Pick<Membership, "sessions_left" | "expires_at">,
): boolean {
  if (membership.sessions_left === 0) return true
  if (membership.expires_at && new Date(membership.expires_at) < new Date()) {
    return true
  }
  return false
}

function authHeaders(): HeadersInit {
  const token = getStoredToken()
  if (!token) {
    throw new Error("Unauthorized")
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const body: unknown = await response.json()
  if (!response.ok) {
    const record = body as { error?: unknown; errors?: unknown }
    const message =
      typeof record.error === "string"
        ? record.error
        : Array.isArray(record.errors)
          ? record.errors.join(", ")
          : "Request failed"
    throw new Error(message)
  }
  return body as T
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
  const body = await parseJson<{ memberships: Membership[] }>(response)
  return body.memberships
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
  return parseJson<CheckInResult>(response)
}
