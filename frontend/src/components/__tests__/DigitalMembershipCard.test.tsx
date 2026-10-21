import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DigitalMembershipCard } from "../DigitalMembershipCard"
import type { MembershipDetail } from "../../lib/memberships"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock digitalCardGenerator functions
vi.mock("../../lib/digitalCardGenerator", () => ({
  generateQRCodeDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,mockQrDataUrl"),
  downloadMembershipCardPng: vi.fn().mockResolvedValue(undefined),
}))

import { downloadMembershipCardPng } from "../../lib/digitalCardGenerator"

const mockDetail: MembershipDetail = {
  id: "uuid-1234-5678",
  customer_name: "Nguyễn Văn A",
  phone: "0901234567",
  sessions_left: 8,
  expires_at: null,
  status: "active",
  qr_code_value: "PUNCHBOOK:uuid-1234-5678",
  shop: {
    id: "shop-1",
    name: "Lan Spa & Massage",
    phone: "0988888888",
    address: "123 Đường ABC",
  },
  package: {
    id: "pkg-1",
    name: "Gói Massage Body 10 buổi",
    price: 1500000,
    sessions_count: 10,
  },
  check_ins: [],
  invoices: [],
}

describe("DigitalMembershipCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders member name, phone, package, and shop name", async () => {
    render(<DigitalMembershipCard membership={mockDetail} />)

    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument()
    expect(screen.getByText("0901234567")).toBeInTheDocument()
    expect(screen.getByText("Gói Massage Body 10 buổi")).toBeInTheDocument()
    expect(screen.getByText("Lan Spa & Massage")).toBeInTheDocument()
    expect(screen.getByText("uuid-1234-5678")).toBeInTheDocument()
  })

  it("displays the generated QR code image", async () => {
    render(<DigitalMembershipCard membership={mockDetail} />)

    await waitFor(() => {
      const qrImg = screen.getByRole("img", {
        name: /Mã QR thẻ hội viên của Nguyễn Văn A/i,
      })
      expect(qrImg).toBeInTheDocument()
      expect(qrImg).toHaveAttribute("src", "data:image/png;base64,mockQrDataUrl")
    })
  })

  it("copies the QR value when clicking copy button", async () => {
    const user = userEvent.setup()
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    })

    render(<DigitalMembershipCard membership={mockDetail} />)

    const copyBtn = screen.getByRole("button", { name: /Sao chép mã/i })
    await user.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledWith("PUNCHBOOK:uuid-1234-5678")
    await waitFor(() => {
      expect(screen.getByText(/Đã chép mã/i)).toBeInTheDocument()
    })
  })

  it("calls downloadMembershipCardPng when clicking download PNG button", async () => {
    const user = userEvent.setup()
    render(<DigitalMembershipCard membership={mockDetail} />)

    const downloadBtn = screen.getByRole("button", { name: /Tải về PNG/i })
    await user.click(downloadBtn)

    expect(downloadMembershipCardPng).toHaveBeenCalledWith({
      membership: mockDetail,
      shopName: "Lan Spa & Massage",
    })
  })

  it("calls window.print when clicking print button", async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {})

    render(<DigitalMembershipCard membership={mockDetail} />)

    const printBtn = screen.getByRole("button", { name: /In thẻ/i })
    await user.click(printBtn)

    expect(printSpy).toHaveBeenCalled()
    printSpy.mockRestore()
  })
})
