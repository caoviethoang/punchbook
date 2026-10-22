import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { WebhookEventsSection } from "../WebhookEventsSection"
import * as webhookApi from "../../../lib/webhookEvents"

vi.mock("../../../lib/webhookEvents", () => ({
  fetchWebhookEvents: vi.fn(),
  retryWebhookEvent: vi.fn(),
}))

describe("WebhookEventsSection", () => {
  const onToast = vi.fn()

  const mockEvents: webhookApi.WebhookEvent[] = [
    {
      id: "ev-1",
      shop_id: "shop-1",
      source: "payos",
      event_type: "payment",
      order_code: 123456,
      payload: {},
      status: "success",
      attempts: 1,
      max_attempts: 5,
      last_error: null,
      processed_at: "2026-10-22T08:00:00Z",
      failed_at: null,
      created_at: "2026-10-22T08:00:00Z",
      updated_at: "2026-10-22T08:00:00Z",
      retryable: false,
    },
    {
      id: "ev-2",
      shop_id: "shop-1",
      source: "payos",
      event_type: "payment",
      order_code: 654321,
      payload: {},
      status: "dead_letter",
      attempts: 5,
      max_attempts: 5,
      last_error: "Connection timeout",
      processed_at: null,
      failed_at: "2026-10-22T08:30:00Z",
      created_at: "2026-10-22T08:00:00Z",
      updated_at: "2026-10-22T08:30:00Z",
      retryable: true,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(webhookApi.fetchWebhookEvents).mockResolvedValue({
      webhook_events: mockEvents,
      meta: { total: 2, page: 1, per_page: 10 },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it("does not render if isAdmin is false", () => {
    const { container } = render(<WebhookEventsSection isAdmin={false} onToast={onToast} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders webhook events table with status badges and details", async () => {
    render(<WebhookEventsSection isAdmin={true} onToast={onToast} />)

    await waitFor(() => {
      expect(screen.getByText("Lịch sử Webhook PayOS & Dead-Letter Queue")).toBeInTheDocument()
    })

    expect(screen.getByText("#123456")).toBeInTheDocument()
    expect(screen.getByText("#654321")).toBeInTheDocument()
    expect(screen.getAllByText("Thành công").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Dead Letter (DLQ)")).toBeInTheDocument()
    expect(screen.getByText("Connection timeout")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Thử lại/i })).toBeInTheDocument()
  })

  it("triggers retry when retry button is clicked", async () => {
    vi.mocked(webhookApi.retryWebhookEvent).mockResolvedValueOnce({
      webhook_event: {
        ...mockEvents[1],
        status: "pending",
        last_error: null,
      },
      message: "Webhook retry successfully enqueued",
    })

    render(<WebhookEventsSection isAdmin={true} onToast={onToast} />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Thử lại/i })).toBeInTheDocument()
    })

    const retryBtn = screen.getByRole("button", { name: /Thử lại/i })
    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(webhookApi.retryWebhookEvent).toHaveBeenCalledWith("ev-2")
      expect(onToast).toHaveBeenCalledWith(
        expect.stringContaining("Đã đưa đơn #654321 vào hàng đợi thử lại"),
        "success"
      )
    })
  })

  it("filters events by tab", async () => {
    render(<WebhookEventsSection isAdmin={true} onToast={onToast} />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Dead-Letter Queue" })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Dead-Letter Queue" }))

    await waitFor(() => {
      expect(webhookApi.fetchWebhookEvents).toHaveBeenCalledWith("dead_letter", 1, 10)
    })
  })
})
