import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThermalReceiptModal, type ReceiptData } from "../ThermalReceiptModal"

describe("ThermalReceiptModal", () => {
  const mockReceipt: ReceiptData = {
    shopName: "PunchBook Studio 1",
    shopAddress: "123 Đường ABC, Quận 1",
    shopPhone: "0901234560",
    customerName: "Nguyễn Văn A",
    customerPhone: "0912345678",
    packageName: "Gói 10 buổi Yoga",
    sessionsLeft: 8,
    checkedInAt: "2026-10-29T08:00:00Z",
    staffName: "Lễ tân Mai",
  }

  let printSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    printSpy = vi.spyOn(window, "print").mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it("renders receipt details in on-screen modal and print portal", () => {
    render(<ThermalReceiptModal receipt={mockReceipt} onClose={vi.fn()} />)

    // Verify content in the preview
    expect(screen.getAllByText("PunchBook Studio 1").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("123 Đường ABC, Quận 1").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("SĐT: 0901234560").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("PHIẾU XÁC NHẬN CHECK-IN").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Nguyễn Văn A").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("0912345678").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Gói 10 buổi Yoga").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("8 buổi").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Lễ tân Mai").length).toBeGreaterThanOrEqual(1)

    // Verify print portal is rendered in document.body
    const printPortal = document.getElementById("thermal-receipt-print-root")
    expect(printPortal).toBeInTheDocument()
    expect(printPortal).toHaveClass("hidden", "print:block")
  })

  it("handles unlimited sessions when sessionsLeft is null", () => {
    const unlimitedReceipt: ReceiptData = {
      ...mockReceipt,
      sessionsLeft: null,
    }

    render(<ThermalReceiptModal receipt={unlimitedReceipt} onClose={vi.fn()} />)
    expect(screen.getAllByText("Không giới hạn").length).toBeGreaterThanOrEqual(1)
  })

  it("automatically triggers window.print after mount timeout", () => {
    render(<ThermalReceiptModal receipt={mockReceipt} onClose={vi.fn()} />)

    expect(printSpy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(350)
    expect(printSpy).toHaveBeenCalledTimes(1)
  })

  it("triggers window.print when clicking In ngay button", async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    render(<ThermalReceiptModal receipt={mockReceipt} onClose={vi.fn()} />)

    const printButton = screen.getByRole("button", { name: /In ngay/i })
    await user.click(printButton)

    expect(printSpy).toHaveBeenCalled()
  })

  it("calls onClose when clicking close button", async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const onCloseMock = vi.fn()

    render(<ThermalReceiptModal receipt={mockReceipt} onClose={onCloseMock} />)

    const closeButtons = screen.getAllByRole("button", { name: "" })
    await user.click(closeButtons[0])

    expect(onCloseMock).toHaveBeenCalled()
  })
})

