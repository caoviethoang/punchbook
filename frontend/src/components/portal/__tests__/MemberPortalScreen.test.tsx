import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import QRCode from "qrcode"
import { MemberPortalScreen } from "../MemberPortalScreen"
import * as portalApi from "../../../lib/memberPortal"

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,portal-qr"),
  },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("MemberPortalScreen", () => {
  const mockProfile: portalApi.PortalProfileResponse = {
    member: {
      id: "mem-1",
      customer_name: "Nguyen Van A",
      phone: "0901234567",
      status: "active",
      sessions_left: 7,
      expires_at: null,
      qr_code_value: "PUNCHBOOK:mem-1",
      public_token: "pub-tok-123",
      assigned_staff: { id: "tr-1", name: "HLV Tuan Kiet" },
      package: {
        id: "pkg-1",
        name: "Boxing 10 buổi",
        price: 1500000,
        sessions_count: 10,
        duration_days: null,
      },
      shop: {
        id: "shop-1",
        name: "Alpha Boxing Club",
        phone: "0988777666",
        address: "123 Nguyen Trai, Q1",
        bank_name: "TPBank",
        bank_account_no: "0123456789",
        bank_account_name: "ALPHA BOXING",
      },
    },
    available_packages: [
      {
        id: "pkg-1",
        name: "Boxing 10 buổi",
        price: 1500000,
        sessions_count: 10,
        duration_days: null,
      },
    ],
  }

  const mockHistory: portalApi.PortalHistoryResponse = {
    check_ins: [{ id: "ci-1", checked_in_at: "2026-11-10T09:00:00Z" }],
    invoices: [
      {
        id: "inv-1",
        amount: 1500000,
        status: "paid",
        created_at: "2026-11-01T08:00:00Z",
      },
    ],
  }

  beforeEach(() => {
    vi.spyOn(portalApi, "fetchMemberPortalProfile").mockResolvedValue(mockProfile)
    vi.spyOn(portalApi, "fetchMemberPortalHistory").mockResolvedValue(mockHistory)
  })

  it("renders member digital card, QR code, progress bar, and trainer info", async () => {
    render(<MemberPortalScreen token="pub-tok-123" />)

    await waitFor(() => {
      expect(screen.getByText("Alpha Boxing Club")).toBeInTheDocument()
      expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
      expect(screen.getByText("Còn 7/10 buổi")).toBeInTheDocument()
      expect(screen.getByText(/HLV Tuan Kiet/)).toBeInTheDocument()
      expect(QRCode.toDataURL).toHaveBeenCalledWith("PUNCHBOOK:mem-1", expect.any(Object))
    })

    const qrImg = screen.getByAltText("Mã QR Check-in") as HTMLImageElement
    expect(qrImg.src).toContain("data:image/png;base64,portal-qr")
  })

  it("switches between check-in history and invoices tabs", async () => {
    render(<MemberPortalScreen token="pub-tok-123" />)

    await waitFor(() => {
      expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /Lịch sử tập/i }))
    await waitFor(() => {
      expect(screen.getByText("Điểm danh thành công")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /Hóa đơn/i }))
    await waitFor(() => {
      expect(screen.getByText("Đã thanh toán")).toBeInTheDocument()
    })
  })

  it("supports self-renewal and displays payOS checkout link and VietQR", async () => {
    const renewSpy = vi.spyOn(portalApi, "renewMemberPortal").mockResolvedValue({
      invoice: { id: "inv-2", amount: 1500000, status: "pending" },
      payos: { checkout_url: "https://pay.payos.vn/web/self123", qr_code: "qr-str" },
    })

    render(<MemberPortalScreen token="pub-tok-123" />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Gia hạn gói tập ngay/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /Gia hạn gói tập ngay/i }))
    fireEvent.click(screen.getByRole("button", { name: /Tạo mã thanh toán/i }))

    await waitFor(() => {
      expect(renewSpy).toHaveBeenCalledWith("pub-tok-123", "pkg-1")
      expect(screen.getByText("Đã tạo yêu cầu thanh toán thành công!")).toBeInTheDocument()
      expect(screen.getByRole("link", { name: /Mở trang thanh toán payOS/i })).toHaveAttribute(
        "href",
        "https://pay.payos.vn/web/self123",
      )
      expect(screen.getByAltText("VietQR")).toBeInTheDocument()
    })
  })

  it("shows error view when portal token is invalid", async () => {
    vi.spyOn(portalApi, "fetchMemberPortalProfile").mockRejectedValue(new Error("Membership not found"))

    render(<MemberPortalScreen token="bad-token" />)

    await waitFor(() => {
      expect(screen.getByText("Không tìm thấy thẻ hội viên")).toBeInTheDocument()
      expect(screen.getByText("Membership not found")).toBeInTheDocument()
    })
  })
})
