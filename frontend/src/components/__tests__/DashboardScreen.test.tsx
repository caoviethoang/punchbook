import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { DashboardScreen } from "../../components/DashboardScreen"
import * as membershipsApi from "../../lib/memberships"
import type { Staff } from "../../lib/auth"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

vi.mock("../../hooks/useDashboard", () => ({
  useDashboard: () => ({
    data: {
      revenue_this_month: 1000000,
      active_memberships_count: 5,
      expiring_within_7_days_count: 2,
      daily_revenue_30_days: [],
      check_in_frequency_by_hour: [],
      peak_check_in_hour: null,
      revenue_by_package: [
        {
          package_id: "pkg-1",
          package_name: "Gói Massage 10 buổi",
          sales_count: 2,
          invoices_count: 2,
          total_revenue: 1000000,
          percentage: 100.0,
        },
      ],
    },
    loading: false,
    error: null,
    load: vi.fn().mockResolvedValue(undefined),
  }),
}))

describe("DashboardScreen", () => {
  it("renders AnalyticsCharts for admin users", () => {
    render(<DashboardScreen currentStaff={null} />) // null means admin per component logic
    const chartHeader = screen.getByText(/Phân tích & Thống kê Kinh doanh/i)
    expect(chartHeader).toBeInTheDocument()
  })

  it("does not render AnalyticsCharts for non‑admin staff", () => {
    const staff = { role: "staff" } as unknown as Staff
    render(<DashboardScreen currentStaff={staff} />)
    const chartHeader = screen.queryByText(/Phân tích & Thống kê Kinh doanh/i)
    expect(chartHeader).not.toBeInTheDocument()
  })

  it("filters to expiring memberships when clicking the expiring metric card", async () => {
    const fetchSpy = vi.spyOn(membershipsApi, "fetchMemberships").mockResolvedValue({
      memberships: [],
      meta: { page: 1, per_page: 20, total: 0, total_pages: 1 },
    })

    render(<DashboardScreen currentStaff={null} />)

    const expiringCard = screen.getByRole("button", {
      name: /Sắp hết hạn/i,
    })
    expect(expiringCard).toBeInTheDocument()

    fireEvent.click(expiringCard)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "expiring",
        }),
      )
    })
  })

  it("allows switching to package revenue breakdown tab in AnalyticsCharts", () => {
    render(<DashboardScreen currentStaff={null} />)

    const packageTab = screen.getByRole("button", { name: /Doanh thu theo gói/i })
    expect(packageTab).toBeInTheDocument()

    fireEvent.click(packageTab)

    expect(screen.getAllByText("Gói Massage 10 buổi").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("100%").length).toBeGreaterThanOrEqual(1)
  })
})
