import { apiBaseUrl } from "./auth"
import { authHeaders, parseApiResponse } from "./api"
import type { BaseMembership } from "./memberships"

export type MembershipStatus = "active" | "expiring" | "expired"

export interface DashboardMembership extends BaseMembership {
  status: MembershipStatus
}

export interface DashboardData {
  revenue_this_month: number
  active_memberships_count: number
  expiring_within_7_days_count: number
  memberships: DashboardMembership[]
}

export const STATUS_LABEL: Record<MembershipStatus, string> = {
  active: "Còn hạn",
  expiring: "Sắp hết",
  expired: "Đã hết",
}

export const STATUS_CLASS: Record<MembershipStatus, string> = {
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  expiring:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  expired: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
}

/** GET /dashboard — shop-scoped stats + membership list with status. */
export async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch(`${apiBaseUrl}/dashboard`, {
    headers: authHeaders(),
  })
  return parseApiResponse<DashboardData>(response)
}
