import { describe, it, expect, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { AnalyticsCharts } from "../AnalyticsCharts"
import type { DailyRevenueData, HourlyCheckInData, PackageRevenueData, PeakHourData } from "../../lib/dashboard"

afterEach(() => {
  cleanup()
})

describe("AnalyticsCharts", () => {
  const mockDailyRevenue: DailyRevenueData[] = [
    { date: "2026-10-01", revenue: 500000 },
    { date: "2026-10-02", revenue: 800000 },
  ]
  const mockPackageRevenue: PackageRevenueData[] = [
    {
      package_id: "pkg-1",
      package_name: "Gói Gym 1 tháng",
      sales_count: 5,
      invoices_count: 5,
      total_revenue: 2500000,
      percentage: 100,
    },
  ]
  const mockCheckInFrequency: HourlyCheckInData[] = [
    { hour: 9, label: "09:00", count: 12 },
    { hour: 10, label: "10:00", count: 20 },
  ]
  const mockPeakHour: PeakHourData = {
    hour: 10,
    label: "10:00 - 11:00",
    count: 20,
    recommendation: "Bố trí thêm nhân sự vào khung giờ này",
  }

  it("renders tab buttons with whitespace-nowrap and shrink-0 to prevent text misalignments", () => {
    render(
      <AnalyticsCharts
        dailyRevenue={mockDailyRevenue}
        packageRevenue={mockPackageRevenue}
        checkInFrequency={mockCheckInFrequency}
        peakHour={mockPeakHour}
      />,
    )

    const revenueTab = screen.getByRole("button", { name: /Doanh thu 30 ngày/i })
    const packagesTab = screen.getByRole("button", { name: /Doanh thu theo gói/i })
    const checkInsTab = screen.getByRole("button", { name: /Tần suất Check-in 24h/i })

    expect(revenueTab).toHaveClass("whitespace-nowrap")
    expect(revenueTab).toHaveClass("shrink-0")
    expect(packagesTab).toHaveClass("whitespace-nowrap")
    expect(packagesTab).toHaveClass("shrink-0")
    expect(checkInsTab).toHaveClass("whitespace-nowrap")
    expect(checkInsTab).toHaveClass("shrink-0")
  })

  it("switches between charts when clicking tabs", () => {
    render(
      <AnalyticsCharts
        dailyRevenue={mockDailyRevenue}
        packageRevenue={mockPackageRevenue}
        checkInFrequency={mockCheckInFrequency}
        peakHour={mockPeakHour}
      />,
    )

    // Initially active: revenue chart
    expect(screen.getAllByText(/Tổng doanh thu 30 ngày/i).length).toBeGreaterThanOrEqual(1)

    // Switch to packages tab
    const packagesTab = screen.getByRole("button", { name: /Doanh thu theo gói/i })
    fireEvent.click(packagesTab)
    expect(screen.getByText("Doanh thu gói tháng này")).toBeInTheDocument()
    expect(screen.getAllByText("Gói Gym 1 tháng").length).toBeGreaterThanOrEqual(1)

    // Switch to checkins tab
    const checkInsTab = screen.getByRole("button", { name: /Tần suất Check-in 24h/i })
    fireEvent.click(checkInsTab)
    expect(screen.getByText("Gợi ý phân bổ nhân sự")).toBeInTheDocument()
  })
})
