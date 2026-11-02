import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { PackagesScreen } from "../PackagesScreen"
import * as packagesApi from "../../lib/packages"
import type { Staff } from "../../lib/auth"
import type { PackageCategory, PackageItem } from "../../lib/packages"

const dummyCategories: PackageCategory[] = [
  { id: "cat-yoga", shop_id: "shop-1", name: "Yoga" },
  { id: "cat-boxing", shop_id: "shop-1", name: "Boxing" },
]

const dummyPackages: PackageItem[] = [
  {
    id: "pkg-1",
    name: "Yoga Cơ bản 1 tháng",
    price: 600000,
    sessions_count: null,
    duration_days: 30,
    package_category_id: "cat-yoga",
    category_name: "Yoga",
  },
  {
    id: "pkg-2",
    name: "Boxing Nâng cao 10 buổi",
    price: 1200000,
    sessions_count: 10,
    duration_days: null,
    package_category_id: "cat-boxing",
    category_name: "Boxing",
  },
  {
    id: "pkg-3",
    name: "Gói lẻ tự do 1 ngày",
    price: 50000,
    sessions_count: null,
    duration_days: 1,
    package_category_id: null,
    category_name: null,
  },
]

const adminStaff: Staff = {
  id: "staff-admin",
  name: "Admin User",
  username: "admin",
  role: "admin",
}

const regularStaff: Staff = {
  id: "staff-receptionist",
  name: "Receptionist",
  username: "staff",
  role: "staff",
}

describe("PackagesScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(packagesApi, "listPackages").mockResolvedValue(dummyPackages)
    vi.spyOn(packagesApi, "listPackageCategories").mockResolvedValue(dummyCategories)
  })

  afterEach(() => {
    cleanup()
  })

  it("renders category management section and buttons for admin users", async () => {
    render(<PackagesScreen currentStaff={adminStaff} />)

    await waitFor(() => {
      expect(screen.getByText("Danh mục gói tập")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Quản lý danh mục/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Tạo gói mới/i })).toBeInTheDocument()
    })
  })

  it("hides category management section and administrative buttons for regular staff", async () => {
    render(<PackagesScreen currentStaff={regularStaff} />)

    await waitFor(() => {
      expect(screen.getByText("Gói Dịch Vụ")).toBeInTheDocument()
    })

    expect(screen.queryByText("Danh mục gói tập")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Quản lý danh mục/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Tạo gói mới/i })).not.toBeInTheDocument()
  })

  it("sorts packages by category by default", async () => {
    render(<PackagesScreen currentStaff={adminStaff} />)

    await waitFor(() => {
      expect(screen.getByText("Boxing Nâng cao 10 buổi")).toBeInTheDocument()
      expect(screen.getByText("Yoga Cơ bản 1 tháng")).toBeInTheDocument()
      expect(screen.getByText("Gói lẻ tự do 1 ngày")).toBeInTheDocument()
    })

    // In category sort (Vietnamese locale): Boxing -> Yoga -> Chưa phân loại (pkg-3)
    const packageHeadings = screen.getAllByRole("heading", { level: 3 })
    const packageTitles = packageHeadings
      .map((h) => h.textContent)
      .filter((text) => text && !text.includes("Danh mục") && !text.includes("Chưa có"))

    expect(packageTitles).toEqual([
      "Boxing Nâng cao 10 buổi",
      "Yoga Cơ bản 1 tháng",
      "Gói lẻ tự do 1 ngày",
    ])
  })

  it("changes sort order when a different sort option is selected", async () => {
    render(<PackagesScreen currentStaff={adminStaff} />)

    await waitFor(() => {
      expect(screen.getByLabelText("Sắp xếp danh sách gói")).toBeInTheDocument()
    })

    const sortSelect = screen.getByLabelText("Sắp xếp danh sách gói")
    fireEvent.change(sortSelect, { target: { value: "price_asc" } })

    const packageHeadings = screen.getAllByRole("heading", { level: 3 })
    const packageTitles = packageHeadings
      .map((h) => h.textContent)
      .filter((text) => text && !text.includes("Danh mục") && !text.includes("Chưa có"))

    // Sorted by price asc: 50,000 -> 600,000 -> 1,200,000
    expect(packageTitles).toEqual([
      "Gói lẻ tự do 1 ngày",
      "Yoga Cơ bản 1 tháng",
      "Boxing Nâng cao 10 buổi",
    ])
  })

  it("filters packages by category tabs including uncategorized", async () => {
    render(<PackagesScreen currentStaff={adminStaff} />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Boxing/ })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /^Chưa phân loại/ })).toBeInTheDocument()
    })

    // Click "Boxing" tab
    fireEvent.click(screen.getByRole("button", { name: /^Boxing/ }))

    expect(screen.getByText("Boxing Nâng cao 10 buổi")).toBeInTheDocument()
    expect(screen.queryByText("Yoga Cơ bản 1 tháng")).not.toBeInTheDocument()

    // Click "Chưa phân loại" tab
    fireEvent.click(screen.getByRole("button", { name: /^Chưa phân loại/ }))

    expect(screen.getByText("Gói lẻ tự do 1 ngày")).toBeInTheDocument()
    expect(screen.queryByText("Boxing Nâng cao 10 buổi")).not.toBeInTheDocument()
  })

  it("opens create package modal and displays category dropdown options", async () => {
    render(<PackagesScreen currentStaff={adminStaff} />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Tạo gói mới/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /Tạo gói mới/i }))

    expect(screen.getByText("Tạo gói dịch vụ mới")).toBeInTheDocument()
    expect(screen.getByText("Danh mục gói / Bộ môn")).toBeInTheDocument()

    const select = screen.getByLabelText("Chọn danh mục gói")
    expect(select).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "-- Chưa chọn danh mục --" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Yoga" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Boxing" })).toBeInTheDocument()
  })
})
