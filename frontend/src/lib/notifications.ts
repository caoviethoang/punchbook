import { apiGet, apiPost } from "./api"

export interface NotificationLog {
  id: string
  shop_id: string
  membership_id?: string | null
  customer_name?: string | null
  channel: "zalo" | "sms" | "email"
  event_type: "welcome" | "check_in_receipt" | "payment_receipt" | "expiring_reminder" | string
  recipient: string
  status: "sent" | "failed" | "skipped"
  error_message?: string | null
  metadata?: Record<string, unknown>
  sent_at?: string | null
  created_at: string
}

export interface FetchNotificationLogsParams {
  channel?: string
  status?: string
  event_type?: string
  page?: number
  per_page?: number
}

export interface NotificationLogsPaginationMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface PaginatedNotificationLogsResult {
  notification_logs: NotificationLog[]
  meta: NotificationLogsPaginationMeta
}

export interface TestNotificationPayload {
  channel: "zalo" | "sms" | "email"
  recipient?: string
}

export interface TestNotificationResult {
  message: string
  result: unknown
}

export async function fetchNotificationLogs(
  params: FetchNotificationLogsParams = {},
): Promise<PaginatedNotificationLogsResult> {
  const queryParams: Record<string, string> = {}
  if (params.channel && params.channel !== "all") queryParams.channel = params.channel
  if (params.status && params.status !== "all") queryParams.status = params.status
  if (params.event_type && params.event_type !== "all") queryParams.event_type = params.event_type
  if (params.page) queryParams.page = params.page.toString()
  if (params.per_page) queryParams.per_page = params.per_page.toString()

  return apiGet<PaginatedNotificationLogsResult>("/notification_logs", {
    query: queryParams,
  })
}

export async function sendTestNotification(
  payload: TestNotificationPayload,
): Promise<TestNotificationResult> {
  return apiPost<TestNotificationResult>("/notification_logs/test", payload)
}
