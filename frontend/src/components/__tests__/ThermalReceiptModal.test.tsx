import { describe, expect, it, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { ThermalReceiptModal, type ReceiptData } from "../ThermalReceiptModal"

describe("ThermalReceiptModal", () => {
  beforeEach(() => {
    vi.spyOn(window, "print").mockImplementation(() => {})
  })

  const mockReceipt: ReceiptData = {
    shopName: "Lan Spa & Wellness",
    shopAddress: "123 Đường Láng, Hà Nội",
    shopPhone: "0901234567",
    customerName: "Nguyễn Thu Hà",
    customerPhone: "0987654321",
    packageName: "Massage Trị Liệu Cổ Vai Gáy 60p",
    sessionsLeft: 3,
    expiresAt: "2026-12-31",
    checkedInAt: "2026-10-21T10:30:00Z",
    staffName: "Lễ tân Mai",
  }

  it("renders POS receipt printable content accurately", () => {
    render(<ThermalReceiptModal receipt={mockReceipt} onClose={() => {}} />)

    expect(screen.getByText("Lan Spa & Wellness")).toBeInTheDocument()
    expect(screen.getByText("123 Đường Láng, Hà Nội")).toBeInTheDocument()
    expect(screen.getByText("SĐT: 0901234567")).toBeInTheDocument()
    expect(screen.getByText("PHIẾU XÁC NHẬN CHECK-IN")).toBeInTheDocument()
    expect(screen.getByText("Nguyễn Thu Hà")).toBeInTheDocument()
    expect(screen.getByText("0987654321")).toBeInTheDocument()
    expect(screen.getByText("Massage Trị Liệu Cổ Vai Gáy 60p")).toBeInTheDocument()
    expect(screen.getByText("3 buổi")).toBeInTheDocument()
  })

  it("does NOT display internal notes on POS printout", () => {
    // Cast to test that even if notes property exists on receipt object, it is never rendered
    const receiptWithNotes = {
      ...mockReceipt,
      notes: "Khách dị ứng tinh dầu quế, hay đau đầu",
    } as unknown as ReceiptData

    render(<ThermalReceiptModal receipt={receiptWithNotes} onClose={() => {}} />)

    expect(
      screen.queryByText(/Khách dị ứng tinh dầu quế, hay đau đầu/i),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/ghi chú/i)).not.toBeInTheDocument()
  })
})
