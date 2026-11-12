import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import RetentionRiskWidget from "../RetentionRiskWidget"
import * as churnRiskLib from "../../../lib/churnRisk"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params && typeof params === "object") {
        return `${key}:${JSON.stringify(params)}`
      }
      return key
    },
  }),
}))

describe("RetentionRiskWidget", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("renders summary KPIs, at-risk members, and triggers 1-click re-engagement", async () => {
    const fetchSpy = vi.spyOn(churnRiskLib, "fetchChurnRiskReport").mockResolvedValue({
      summary: {
        total_at_risk: 2,
        high_risk_count: 1,
        medium_risk_count: 1,
        low_risk_count: 0,
        revenue_at_stake: 3500000,
      },
      members: [
        {
          membership_id: "mem-1",
          customer_name: "Nguyen Van A",
          phone: "0901234567",
          email: "a@example.com",
          package_name: "Boxing 30 Buoi",
          package_price: 2000000,
          sessions_left: 12,
          expires_at: "2027-01-01",
          risk_level: "high",
          days_since_last_visit: 22,
          recent_30d_visits: 1,
          prior_30d_visits: 8,
          frequency_drop_pct: 88,
          last_checked_in_at: "2026-10-20T10:00:00Z",
          last_reengagement_sent_at: null,
        },
        {
          membership_id: "mem-2",
          customer_name: "Tran Thi B",
          phone: "0909998888",
          email: null,
          package_name: "Yoga 1 Thang",
          package_price: 1500000,
          sessions_left: null,
          expires_at: "2026-12-01",
          risk_level: "medium",
          days_since_last_visit: 15,
          recent_30d_visits: 2,
          prior_30d_visits: 4,
          frequency_drop_pct: 50,
          last_checked_in_at: "2026-10-27T10:00:00Z",
          last_reengagement_sent_at: null,
        },
      ],
    })

    const sendSpy = vi.spyOn(churnRiskLib, "sendMemberReengagement").mockResolvedValue({
      message: "Sent",
      membership: {
        id: "mem-1",
        customer_name: "Nguyen Van A",
        phone: "0901234567",
        sessions_left: 12,
        expires_at: "2027-01-01",
        package: { id: "pkg-1", name: "Boxing 30 Buoi" },
        churn_risk_level: "high",
        last_reengagement_sent_at: "2026-11-12T10:00:00Z",
      },
      delivery: [{ success: true, channel: "email", recipient: "a@example.com" }],
    })

    const onSelectDetail = vi.fn()
    render(<RetentionRiskWidget onSelectDetail={onSelectDetail} />)

    await waitFor(() => {
      expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("Tran Thi B")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Nguyen Van A"))
    expect(onSelectDetail).toHaveBeenCalledWith("mem-1")

    const sendBtn = screen.getByRole("button", {
      name: 'churn_risk.send_we_miss_you_aria:{"name":"Nguyen Van A"}',
    })
    fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledWith("mem-1")
    })
    expect(
      screen.getByText('churn_risk.reengagement_sent:{"name":"Nguyen Van A"}'),
    ).toBeInTheDocument()
  })

  it("renders empty state when there are no at-risk members", async () => {
    vi.spyOn(churnRiskLib, "fetchChurnRiskReport").mockResolvedValue({
      summary: {
        total_at_risk: 0,
        high_risk_count: 0,
        medium_risk_count: 0,
        low_risk_count: 0,
        revenue_at_stake: 0,
      },
      members: [],
    })

    render(<RetentionRiskWidget />)

    await waitFor(() => {
      expect(screen.getByText("churn_risk.empty_state")).toBeInTheDocument()
    })
  })

  it("renders error state when report fetch fails", async () => {
    vi.spyOn(churnRiskLib, "fetchChurnRiskReport").mockRejectedValue(
      new Error("Network failure"),
    )

    render(<RetentionRiskWidget />)

    await waitFor(() => {
      expect(screen.getByText("Network failure")).toBeInTheDocument()
    })
  })
})
