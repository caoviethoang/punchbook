import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MembershipDetailModal } from "../MembershipDetailModal"
import * as membershipsApi from "../../lib/memberships"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

vi.mock("../../lib/digitalCardGenerator", () => ({
  generateQRCodeDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,mockQr"),
  downloadMembershipCardPng: vi.fn().mockResolvedValue(undefined),
}))

const mockDetail: membershipsApi.MembershipDetail = {
  id: "mem-test-1",
  customer_name: "Trần Thị B",
  phone: "0912345678",
  sessions_left: 5,
  expires_at: null,
  status: "active",
  qr_code_value: "PUNCHBOOK:mem-test-1",
  shop: {
    id: "shop-1",
    name: "Lan Spa",
    phone: "0900000000",
    address: "Hà Nội",
  },
  package: {
    id: "pkg-1",
    name: "Gói Trị Liệu",
    price: 800000,
    sessions_count: 5,
  },
  check_ins: [
    {
      id: "ci-1",
      checked_in_at: new Date().toISOString(),
      staff: { id: "st-1", name: "Nhân viên Mai" },
    },
  ],
  invoices: [
    {
      id: "inv-1",
      amount: 800000,
      status: "paid",
      payos_transaction_id: "TX123",
      payos_checkout_url: null,
      created_at: new Date().toISOString(),
    },
  ],
}

describe("MembershipDetailModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("loads and displays member detail with digital QR card by default", async () => {
    vi.spyOn(membershipsApi, "getMembershipDetail").mockResolvedValue(mockDetail)

    render(<MembershipDetailModal membershipId="mem-test-1" onClose={() => {}} />)

    expect(screen.getByText(/Đang tải thông tin chi tiết hội viên/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getAllByText("Trần Thị B")[0]).toBeInTheDocument()
      expect(screen.getAllByText("0912345678")[0]).toBeInTheDocument()
      expect(screen.getByText("Thẻ hội viên (QR)")).toBeInTheDocument()
      expect(screen.getByText("Lịch sử Check-in")).toBeInTheDocument()
      expect(screen.getByText("Lịch sử Thanh toán")).toBeInTheDocument()
    })

    // QR Card content is visible
    expect(screen.getByRole("button", { name: /In thẻ/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Tải về PNG/i })).toBeInTheDocument()
  })

  it("switches to check-in history tab and payment history tab", async () => {
    const user = userEvent.setup()
    vi.spyOn(membershipsApi, "getMembershipDetail").mockResolvedValue(mockDetail)

    render(<MembershipDetailModal membershipId="mem-test-1" onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getAllByText("Trần Thị B")[0]).toBeInTheDocument()
    })

    // Switch to Check-in tab
    const checkInTabBtn = screen.getByRole("button", { name: /Lịch sử Check-in/i })
    await user.click(checkInTabBtn)

    expect(screen.getByText("Nhân viên Mai")).toBeInTheDocument()

    // Switch to Invoices tab
    const invoiceTabBtn = screen.getByRole("button", { name: /Lịch sử Thanh toán/i })
    await user.click(invoiceTabBtn)

    expect(screen.getByText(/Tx: TX123/i)).toBeInTheDocument()
  })

  it("displays error message when fetching member detail fails", async () => {
    vi.spyOn(membershipsApi, "getMembershipDetail").mockRejectedValue(
      new Error("Không thể kết nối đến máy chủ"),
    )

    render(<MembershipDetailModal membershipId="mem-err" onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText("Không thể kết nối đến máy chủ")).toBeInTheDocument()
    })
  })

  it("displays internal notes prominently when present and allows editing", async () => {
    const user = userEvent.setup()
    const detailWithNotes: membershipsApi.MembershipDetail = {
      ...mockDetail,
      notes: "Khách dị ứng tinh dầu hoa hồng, ưu tiên kỹ thuật viên nữ",
    }
    vi.spyOn(membershipsApi, "getMembershipDetail").mockResolvedValue(detailWithNotes)
    const updateSpy = vi.spyOn(membershipsApi, "updateMembership").mockResolvedValue({
      ...detailWithNotes,
      notes: "Cập nhật: đổi sang phòng đơn",
    })

    render(<MembershipDetailModal membershipId="mem-test-1" onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText(/Ghi chú nội bộ/i)).toBeInTheDocument()
      expect(
        screen.getByText("Khách dị ứng tinh dầu hoa hồng, ưu tiên kỹ thuật viên nữ"),
      ).toBeInTheDocument()
    })

    // Click edit button
    const editBtn = screen.getByRole("button", { name: /Sửa/i })
    await user.click(editBtn)

    const textarea = screen.getByPlaceholderText(/Nhập ghi chú riêng cho hội viên/i)
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue("Khách dị ứng tinh dầu hoa hồng, ưu tiên kỹ thuật viên nữ")

    // Update text
    await user.clear(textarea)
    await user.type(textarea, "Cập nhật: đổi sang phòng đơn")

    const saveBtn = screen.getByRole("button", { name: /Lưu ghi chú/i })
    await user.click(saveBtn)

    expect(updateSpy).toHaveBeenCalledWith("mem-test-1", {
      notes: "Cập nhật: đổi sang phòng đơn",
    })

    await waitFor(() => {
      expect(screen.getByText("Cập nhật: đổi sang phòng đơn")).toBeInTheDocument()
    })
  })

  it("displays add notes button when empty and saves new note", async () => {
    const user = userEvent.setup()
    const detailWithoutNotes: membershipsApi.MembershipDetail = {
      ...mockDetail,
      notes: null,
    }
    vi.spyOn(membershipsApi, "getMembershipDetail").mockResolvedValue(detailWithoutNotes)
    const updateSpy = vi.spyOn(membershipsApi, "updateMembership").mockResolvedValue({
      ...detailWithoutNotes,
      notes: "Ghi chú mới thêm",
    })

    render(<MembershipDetailModal membershipId="mem-test-1" onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText(/Thêm ghi chú nội bộ/i)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/Thêm ghi chú nội bộ/i))

    const textarea = screen.getByPlaceholderText(/Nhập ghi chú riêng cho hội viên/i)
    await user.type(textarea, "Ghi chú mới thêm")

    const saveBtn = screen.getByRole("button", { name: /Lưu ghi chú/i })
    await user.click(saveBtn)

    expect(updateSpy).toHaveBeenCalledWith("mem-test-1", {
      notes: "Ghi chú mới thêm",
    })

    await waitFor(() => {
      expect(screen.getByText("Ghi chú mới thêm")).toBeInTheDocument()
    })
  })
})
