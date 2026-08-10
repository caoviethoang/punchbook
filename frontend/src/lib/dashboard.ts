import { apiBaseUrl, getStoredToken } from "./auth"

export type MembershipStatus = "active" | "expiring" | "expired"

export interface DashboardMembership {
  id: string
  customer_name: string
  phone: string
  sessions_left: number | null
  expires_at: string | null
  status: MembershipStatus
  package: {
    id: string
    name: string
  }
}

export interface DashboardData {
  revenue_this_month: number
  active_memberships_count: number
  expiring_within_7_days_count: number
  memberships: DashboardMembership[]
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

/** GET /dashboard — shop-scoped stats + membership list with status. */
export async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch(`${apiBaseUrl}/dashboard`, {
    headers: authHeaders(),
  })
  return parseJson<DashboardData>(response)
}
