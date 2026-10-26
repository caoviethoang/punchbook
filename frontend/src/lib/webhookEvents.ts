import { apiGet, apiPost } from "./api"

export type WebhookEventStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "dead_letter"
  | "invalid_signature"

export interface WebhookEvent {
  id: string
  shop_id: string | null
  source: string
  event_type: string
  order_code: number | null
  payload: Record<string, unknown>
  status: WebhookEventStatus
  attempts: number
  max_attempts: number
  last_error: string | null
  processed_at: string | null
  failed_at: string | null
  created_at: string
  updated_at: string
  retryable: boolean
}

export interface WebhookEventsResponse {
  webhook_events: WebhookEvent[]
  meta: {
    total: number
    page: number
    per_page: number
  }
}

export async function fetchWebhookEvents(
  status?: string,
  page = 1,
  perPage = 20
): Promise<WebhookEventsResponse> {
  const query = new URLSearchParams()
  if (status) query.set("status", status)
  query.set("page", String(page))
  query.set("per_page", String(perPage))

  return apiGet<WebhookEventsResponse>(`/webhook_events?${query.toString()}`)
}

export async function retryWebhookEvent(
  id: string
): Promise<{ webhook_event: WebhookEvent; message: string }> {
  return apiPost<{ webhook_event: WebhookEvent; message: string }>(
    `/webhook_events/${id}/retry`,
    {}
  )
}
