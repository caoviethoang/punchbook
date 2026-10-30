import { describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CheckInHistoryTab } from "../CheckInHistoryTab"
import type { MembershipDetailCheckIn } from "../../../lib/memberships"

describe("CheckInHistoryTab", () => {
  it("renders empty state when checkIns array is empty", () => {
    render(<CheckInHistoryTab checkIns={[]} onPrintReceipt={vi.fn()} />)

    expect(screen.getByText("Chưa có lịch sử Check-in")).toBeInTheDocument()
    expect(
      screen.getByText("Hội viên này chưa thực hiện lượt check-in nào."),
    ).toBeInTheDocument()
  })

  it("renders check-in table with staff name and fallback to Hệ thống", async () => {
    const user = userEvent.setup()
    const onPrintReceiptMock = vi.fn()

    const checkIns: MembershipDetailCheckIn[] = [
      {
        id: "ci-1",
        checked_in_at: "2026-10-27T10:00:00Z",
        staff: { id: "st-1", name: "HLV Tuấn" },
      },
      {
        id: "ci-2",
        checked_in_at: "2026-10-26T15:30:00Z",
        staff: null,
      },
      {
        id: "ci-3",
        checked_in_at: "2026-10-25T08:15:00Z",
        staff: { id: null, name: "" },
      },
    ]

    render(
      <CheckInHistoryTab
        checkIns={checkIns}
        onPrintReceipt={onPrintReceiptMock}
      />,
    )

    // Table headers
    expect(
      screen.getByRole("columnheader", { name: "Thời gian Check-in" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "Nhân viên thực hiện" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "In phiếu" }),
    ).toBeInTheDocument()

    // Staff name and fallback
    expect(screen.getByText("HLV Tuấn")).toBeInTheDocument()
    const heThongElements = screen.getAllByText("Hệ thống")
    expect(heThongElements).toHaveLength(2)

    // Clicking 'In phiếu' for first item
    const printButtons = screen.getAllByRole("button", { name: /In phiếu/i })
    expect(printButtons).toHaveLength(3)

    await user.click(printButtons[0])
    expect(onPrintReceiptMock).toHaveBeenCalledWith(
      "2026-10-27T10:00:00Z",
      "HLV Tuấn",
    )

    // Clicking 'In phiếu' for second item (null staff -> Hệ thống)
    await user.click(printButtons[1])
    expect(onPrintReceiptMock).toHaveBeenCalledWith(
      "2026-10-26T15:30:00Z",
      "Hệ thống",
    )
  })
})
