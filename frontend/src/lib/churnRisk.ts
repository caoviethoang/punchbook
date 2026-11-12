import { apiGet, apiPost } from "./api"
import type { Membership } from "./memberships"

export type ChurnRiskLevel = "high" | "medium" | "low"

export interface ChurnRiskSummary {
  total_at_risk: number
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  revenue_at_stake: number
}

export interface AtRiskMemberItem {
  membership_id: string
  customer_name: string
  phone: string
  email?: string | null
  package_name: string
  package_price: number
  sessions_left: number | null
  expires_at: string | null
  risk_level: ChurnRiskLevel
  days_since_last_visit: number
  recent_30d_visits: number
  prior_30d_visits: number
  frequency_drop_pct: number
  last_checked_in_at: string | null
  last_reengagement_sent_at: string | null
}

export interface ChurnRiskReportResponse {
  summary: ChurnRiskSummary
  members: AtRiskMemberItem[]
}

export interface ReengagementDeliveryResult {
  success: boolean
  channel: string
  recipient?: string
  error?: string
}

export interface SendReengagementResponse {
  message: string
  membership: Membership
  delivery: ReengagementDeliveryResult[]
}

export async function fetchChurnRiskReport(): Promise<ChurnRiskReportResponse> {
  return apiGet<ChurnRiskReportResponse>("/reports/churn_risk")
}

export async function sendMemberReengagement(
  membershipId: string,
  message?: string,
  channels?: string[],
): Promise<SendReengagementResponse> {
  return apiPost<SendReengagementResponse>(`/memberships/${membershipId}/send_reengagement`, {
    ...(message ? { message } : {}),
    ...(channels && channels.length > 0 ? { channels } : {}),
  })
}
