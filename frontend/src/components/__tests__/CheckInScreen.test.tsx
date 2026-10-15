import { render, screen, cleanup } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { CheckInScreen } from "../CheckInScreen"

afterEach(() => {
  cleanup()
})

const mockMemberships = [
  {
    id: "mem-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    sessions_left: 5,
    expires_at: null,
    checked_in_today: false,
    package: {
      id: "pkg-1",
      name: "Gói 10 buổi",
      sessions_count: 10,
      duration_days: null,
      price: 500000,
    },
  },
  {
    id: "mem-2",
    customer_name: "Tran Thi B",
    phone: "0912345678",
    sessions_left: null,
    expires_at: "2026-12-31",
    checked_in_today: true,
    package: {
      id: "pkg-2",
      name: "Gói tháng",
      sessions_count: null,
      duration_days: 30,
      price: 800000,
    },
  },
]

vi.mock("../../hooks/useCheckInScreen", () => ({
  useCheckInScreen: () => ({
    query: "",
    setQuery: vi.fn(),
    memberships: mockMemberships,
    page: 1,
    setPage: vi.fn(),
    paginationMeta: { page: 1, per_page: 20, total: 25, total_pages: 2 },
    checkingInId: null,
    checkInMessage: null,
    toast: null,
    setToast: vi.fn(),
    isQRScannerOpen: false,
    setIsQRScannerOpen: vi.fn(),
    selectedReceipt: null,
    setSelectedReceipt: vi.fn(),
    inputRef: { current: null },
    detailMembershipId: null,
    setDetailMembershipId: vi.fn(),
    renewingMembership: null,
    setRenewingMembership: vi.fn(),
    isLoading: false,
    apiError: null,
    handleClear: vi.fn(),
    handleKeyDown: vi.fn(),
    handleCheckIn: vi.fn(),
    handleQRScan: vi.fn(),
    handlePrintReceipt: vi.fn(),
    staffs: [],
    loadingStaffs: false,
    selectedStaffId: null,
    setSelectedStaffId: vi.fn(),
  }),
}))

describe("CheckInScreen", () => {
  it("displays the list of members by default without requiring search input", () => {
    render(<CheckInScreen />)

    expect(screen.getByText("Danh sách hội viên (25)")).toBeInTheDocument()
    expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    expect(screen.getByText("Tran Thi B")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Check-in cho Nguyen Van A" })).toBeInTheDocument()
  })

  it("renders pagination controls when total_pages > 1", () => {
    render(<CheckInScreen />)

    expect(screen.getByText(/Hiển thị trang 1 \/ 2/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Trang sau" })).toBeInTheDocument()
  })
})
