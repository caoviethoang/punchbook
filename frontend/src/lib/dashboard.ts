import { apiGet } from "./api"
import type { Membership } from "./memberships"

export type MembershipStatus = "active" | "expiring" | "expired" | "deleted" | "frozen" | "transferred"

export interface DashboardMembership extends Membership {
  status: MembershipStatus
}

export interface DailyRevenueData {
  date: string
  revenue: number
}

export interface HourlyCheckInData {
  hour: number
  label: string
  count: number
}

export interface PeakHourData {
  hour: number
  label: string
  count: number
  recommendation: string
}

export interface PackageRevenueData {
  package_id: string
  package_name: string
  sales_count: number
  invoices_count: number
  total_revenue: number
  percentage: number
}

export interface DashboardData {
  revenue_this_month: number
  active_memberships_count: number
  expiring_within_7_days_count: number
  daily_revenue_30_days?: DailyRevenueData[]
  check_in_frequency_by_hour?: HourlyCheckInData[]
  peak_check_in_hour?: PeakHourData | null
  revenue_by_package?: PackageRevenueData[]
  memberships: DashboardMembership[]
}

export const STATUS_LABEL: Record<MembershipStatus, string> = {
  active: "Còn hạn",
  expiring: "Sắp hết",
  expired: "Đã hết",
  deleted: "Đã xóa",
  frozen: "Bảo lưu",
  transferred: "Đã chuyển nhượng",
}

export const STATUS_CLASS: Record<MembershipStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  expiring: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  expired: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  deleted: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  frozen: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40",
  transferred: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40",
}

/** GET /dashboard — shop-scoped stats + membership list with status. */
export async function fetchDashboard(): Promise<DashboardData> {
  return apiGet<DashboardData>("/dashboard")
}
