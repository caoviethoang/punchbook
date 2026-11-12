import { apiGet, downloadBlob } from "./api"

export interface TrainerCommissionSummary {
  total_trainers: number
  total_sessions_completed: number
  total_sales_count: number
  total_sales_amount: number
  total_session_commission: number
  total_sale_commission: number
  total_commission: number
}

export interface TrainerCommissionRow {
  trainer_id: string
  trainer_name: string
  trainer_role: string
  assigned_clients_count: number
  sessions_completed: number
  session_commission: number
  sales_count: number
  sales_amount: number
  sale_commission: number
  total_commission: number
  payout_status: "pending" | "settled"
}

export interface TrainerCommissionSession {
  check_in_id: string
  membership_id: string
  customer_name: string
  package_name: string
  trainer_id: string
  trainer_name: string | null
  checked_in_at: string | null
  commission_amount: number
}

export interface TrainerCommissionReportResponse {
  month: string
  start_date: string
  end_date: string
  summary: TrainerCommissionSummary
  trainers: TrainerCommissionRow[]
  sessions: TrainerCommissionSession[]
}

/**
 * Fetch monthly Personal Trainer commission report JSON.
 */
export async function getTrainerCommissionsReport(
  month?: string,
  trainerId?: string,
): Promise<TrainerCommissionReportResponse> {
  const query: Record<string, string> = {}
  if (month) query.month = month
  if (trainerId) query.trainer_id = trainerId

  return apiGet<TrainerCommissionReportResponse>("/reports/trainer_commissions", {
    query: Object.keys(query).length > 0 ? query : undefined,
  })
}

/**
 * Download monthly trainer commission Excel report (.xlsx) for paid shops.
 */
export async function downloadTrainerCommissionsExcelReport(
  month: string,
  trainerId?: string,
): Promise<void> {
  const params = new URLSearchParams()
  if (month) params.set("month", month)
  if (trainerId) params.set("trainer_id", trainerId)

  const qs = params.toString()
  return downloadBlob(
    `/reports/trainer_commissions/export${qs ? `?${qs}` : ""}`,
    `punchbook_trainer_commissions_${month || "report"}.xlsx`,
  )
}
