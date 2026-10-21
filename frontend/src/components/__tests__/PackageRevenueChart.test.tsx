import { render, screen, cleanup, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { PackageRevenueChart } from "../analytics/PackageRevenueChart"
import type { PackageRevenueData } from "../../lib/dashboard"

afterEach(() => {
  cleanup()
})

describe("PackageRevenueChart", () => {
  const mockPackageRevenue: PackageRevenueData[] = [
    {
      package_id: "pkg-1",
      package_name: "Gói Massage 10 buổi",
      sales_count: 5,
      invoices_count: 5,
      total_revenue: 5000000,
      percentage: 62.5,
    },
    {
      package_id: "pkg-2",
      package_name: "Gói Gym Tháng",
      sales_count: 3,
      invoices_count: 3,
      total_revenue: 3000000,
      percentage: 37.5,
    },
  ]

  it("renders empty state when packageRevenue is empty", () => {
    render(<PackageRevenueChart packageRevenue={[]} />)
    expect(screen.getByText(/Chưa có dữ liệu doanh thu gói/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Chưa có giao dịch thanh toán gói dịch vụ nào được ghi nhận/i),
    ).toBeInTheDocument()
  })

  it("renders metric cards with correct totals and top selling package", () => {
    render(<PackageRevenueChart packageRevenue={mockPackageRevenue} />)

    // Total revenue across packages: 5tr + 3tr = 8tr VND
    expect(screen.getByText(/8\.000\.000/)).toBeInTheDocument()

    // Total sales: 5 + 3 = 8 lượt
    const salesCard = screen.getByText(/Tổng lượt bán/i).closest(".rounded-xl")
    expect(salesCard).toHaveTextContent("8 lượt")

    // Top package: Gói Massage 10 buổi (displayed in highlight card)
    const matches = screen.getAllByText("Gói Massage 10 buổi")
    expect(matches.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/5 lượt bán/i)).toBeInTheDocument()
  })

  it("renders table breakdown with all packages and their metrics", () => {
    render(<PackageRevenueChart packageRevenue={mockPackageRevenue} />)

    const table = screen.getByRole("table")
    expect(table).toBeInTheDocument()

    const tableScope = within(table)
    expect(tableScope.getByText("Gói Massage 10 buổi")).toBeInTheDocument()
    expect(tableScope.getByText(/5\.000\.000/)).toBeInTheDocument()
    expect(tableScope.getByText("62.5%")).toBeInTheDocument()

    expect(tableScope.getByText("Gói Gym Tháng")).toBeInTheDocument()
    expect(tableScope.getByText(/3\.000\.000/)).toBeInTheDocument()
    expect(tableScope.getByText("37.5%")).toBeInTheDocument()
  })

  it("handles mouse enter and mouse leave on table rows", () => {
    render(<PackageRevenueChart packageRevenue={mockPackageRevenue} />)

    const table = screen.getByRole("table")
    const row = within(table).getByText("Gói Massage 10 buổi").closest("tr")
    expect(row).toBeInTheDocument()

    if (row) {
      fireEvent.mouseEnter(row)
      fireEvent.mouseLeave(row)
    }
  })
})
