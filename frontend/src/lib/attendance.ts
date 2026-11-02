import { apiGet, downloadBlob } from "./api"

export interface AttendanceSummary {
  total_members: number
  active_members_count: number
  inactive_members_count: number
  total_check_ins: number
  avg_check_ins_per_active_member: number
}

export interface AttendanceRecord {
  membership_id: string
  customer_name: string
  phone: string
  card_number?: string | null
  package_name: string
  status: string
  sessions_left: number | null
  expires_at: string | null
  check_ins_count: number
  last_check_in_at: string | null
  is_inactive: boolean
  rank: number | null
}

export interface AttendanceReportResponse {
  month: string
  start_date: string
  end_date: string
  summary: AttendanceSummary
  attendance: AttendanceRecord[]
}

/**
 * Fetch monthly attendance report JSON from backend.
 */
export async function getAttendanceReport(month?: string): Promise<AttendanceReportResponse> {
  const query = month ? { month } : undefined
  return apiGet<AttendanceReportResponse>("/reports/attendance", { query })
}

/**
 * Download monthly attendance Excel file (.xlsx) for paid shops.
 */
export async function downloadAttendanceExcelReport(month: string): Promise<void> {
  const query = month ? `?month=${encodeURIComponent(month)}` : ""
  return downloadBlob(
    `/reports/attendance/export${query}`,
    `punchbook_attendance_${month || "report"}.xlsx`,
  )
}
