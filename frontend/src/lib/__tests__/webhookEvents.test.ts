import { beforeEach, describe, expect, it, vi } from "vitest"
import * as api from "../api"
import { fetchWebhookEvents, retryWebhookEvent } from "../webhookEvents"

vi.mock("../api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

describe("webhookEvents api helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls apiGet with appropriate query params for fetchWebhookEvents", async () => {
    const mockResponse = {
      webhook_events: [],
      meta: { total: 0, page: 1, per_page: 20 },
    }
    vi.mocked(api.apiGet).mockResolvedValueOnce(mockResponse)

    const res = await fetchWebhookEvents("failed", 2, 10)
    expect(api.apiGet).toHaveBeenCalledWith("/webhook_events?status=failed&page=2&per_page=10")
    expect(res).toEqual(mockResponse)
  })

  it("calls apiPost for retryWebhookEvent", async () => {
    const mockEvent = {
      id: "event-123",
      shop_id: "shop-1",
      source: "payos",
      event_type: "payment",
      order_code: 10001,
      payload: {},
      status: "pending" as const,
      attempts: 1,
      max_attempts: 5,
      last_error: null,
      processed_at: null,
      failed_at: null,
      created_at: "2026-10-22T00:00:00Z",
      updated_at: "2026-10-22T00:00:00Z",
      retryable: false,
    }
    const mockResponse = {
      webhook_event: mockEvent,
      message: "Webhook retry successfully enqueued",
    }
    vi.mocked(api.apiPost).mockResolvedValueOnce(mockResponse)

    const res = await retryWebhookEvent("event-123")
    expect(api.apiPost).toHaveBeenCalledWith("/webhook_events/event-123/retry", {})
    expect(res).toEqual(mockResponse)
  })
})
