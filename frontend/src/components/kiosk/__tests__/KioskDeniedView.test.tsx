import { render, screen, cleanup, fireEvent, act } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { KioskDeniedView } from "../KioskDeniedView"
import type { KioskCheckInResult } from "../../../lib/kiosk"
import * as kioskApi from "../../../lib/kiosk"

vi.mock("../../../lib/kiosk", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/kiosk")>("../../../lib/kiosk")
  return {
    ...actual,
    checkKioskInvoiceStatus: vi.fn(),
  }
})

describe("KioskDeniedView", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers()
    })
    vi.useRealTimers()
    cleanup()
    vi.clearAllMocks()
  })

  const deniedResult: KioskCheckInResult = {
    status: "denied",
    code: "FROZEN",
    message: "Thẻ đang trong thời gian bảo lưu.",
    audio_text: "Thẻ đang bảo lưu",
  }

  const renewalResult: KioskCheckInResult = {
    status: "denied",
    code: "OUT_OF_SESSIONS",
    message: "Gói tập đã hết số buổi. Vui lòng gia hạn để tiếp tục.",
    audio_text: "Gói tập đã hết buổi",
    renewal: {
      invoice_id: "inv-123",
      amount: 500000,
      description: "PB123 GIAHAN",
      package_name: "Gói 10 buổi",
      vietqr_url: "https://api.vietqr.io/image/970422-0123456-compact.png",
      payos_checkout_url: "https://pay.payos.vn/web/123",
      bank_name: "MBBank",
      bank_account_no: "0123456",
      bank_account_name: "PUNCHBOOK GYM",
    },
  }

  it("renders denial reason and back button", () => {
    const onReset = vi.fn()
    render(<KioskDeniedView result={deniedResult} onReset={onReset} />)

    expect(screen.getByText("Thẻ đang trong thời gian bảo lưu.")).toBeInTheDocument()
    expect(screen.getByText(/Lý do: FROZEN/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Quay lại|kiosk\.back/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it("renders VietQR renewal QR and bank info when renewal is available", () => {
    render(<KioskDeniedView result={renewalResult} onReset={vi.fn()} />)

    expect(screen.getByText("Gói 10 buổi")).toBeInTheDocument()
    expect(screen.getByText("500.000 ₫")).toBeInTheDocument()
    expect(screen.getByText("0123456")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /VietQR/i })).toHaveAttribute(
      "src",
      "https://api.vietqr.io/image/970422-0123456-compact.png",
    )
  })

  it("polls invoice payment status and triggers onPaidSuccess when paid", async () => {
    const onPaidSuccess = vi.fn()
    vi.mocked(kioskApi.checkKioskInvoiceStatus).mockResolvedValue({
      id: "inv-123",
      status: "paid",
      paid_at: "2026-11-17T10:05:00Z",
    })

    render(
      <KioskDeniedView
        result={renewalResult}
        onReset={vi.fn()}
        onPaidSuccess={onPaidSuccess}
        kioskToken="kiosk-tok-123"
      />,
    )

    // Advance 2.5s for poll interval
    await act(async () => {
      vi.advanceTimersByTime(2600)
    })

    expect(kioskApi.checkKioskInvoiceStatus).toHaveBeenCalledWith("inv-123", "kiosk-tok-123")

    // Advance 1.5s for success delay
    await act(async () => {
      vi.advanceTimersByTime(1600)
    })

    expect(onPaidSuccess).toHaveBeenCalled()
  })
})
