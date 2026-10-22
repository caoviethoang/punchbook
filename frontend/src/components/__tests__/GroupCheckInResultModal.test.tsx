import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { GroupCheckInResultModal } from "../checkin/GroupCheckInResultModal"
import type { BatchCheckInResult, Membership } from "../../lib/memberships"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("GroupCheckInResultModal", () => {
  const dummyMember: Membership = {
    id: "m-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    sessions_left: 9,
    expires_at: null,
    package: { id: "pkg-1", name: "Yoga 10 buổi" },
  }

  const sampleResult: BatchCheckInResult = {
    total: 2,
    success_count: 1,
    failed_count: 1,
    results: [
      {
        membership_id: "m-1",
        customer_name: "Nguyen Van A",
        status: "success",
        membership: dummyMember,
        check_in: { id: "ci-1", checked_in_at: "2026-10-22T09:00:00Z" },
      },
      {
        membership_id: "m-2",
        customer_name: "Tran Van B",
        status: "failed",
        error: "Hội viên đã hết số buổi tập",
      },
    ],
  }

  it("does not render when result is null", () => {
    const { container } = render(
      <GroupCheckInResultModal
        isOpen={true}
        result={null}
        onClose={vi.fn()}
        onPrintReceipt={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders summary badges and participant details correctly", () => {
    render(
      <GroupCheckInResultModal
        isOpen={true}
        result={sampleResult}
        onClose={vi.fn()}
        onPrintReceipt={vi.fn()}
      />,
    )

    expect(screen.getByText("Kết quả điểm danh nhóm")).toBeInTheDocument()
    expect(screen.getByText("Tổng số: 2")).toBeInTheDocument()
    expect(screen.getByText("1 thành công")).toBeInTheDocument()
    expect(screen.getByText("1 thất bại")).toBeInTheDocument()

    expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    expect(
      screen.getByText("Check-in thành công (Còn lại 9 buổi)"),
    ).toBeInTheDocument()

    expect(screen.getByText("Tran Van B")).toBeInTheDocument()
    expect(screen.getByText("Hội viên đã hết số buổi tập")).toBeInTheDocument()
  })

  it("triggers onPrintReceipt for successful member", () => {
    const onPrintReceiptMock = vi.fn()
    render(
      <GroupCheckInResultModal
        isOpen={true}
        result={sampleResult}
        onClose={vi.fn()}
        onPrintReceipt={onPrintReceiptMock}
      />,
    )

    const printButton = screen.getByRole("button", {
      name: "In phiếu cho Nguyen Van A",
    })
    fireEvent.click(printButton)

    expect(onPrintReceiptMock).toHaveBeenCalledWith(
      dummyMember,
      "2026-10-22T09:00:00Z",
    )
  })

  it("calls onClose when clicking close button", () => {
    const onCloseMock = vi.fn()
    render(
      <GroupCheckInResultModal
        isOpen={true}
        result={sampleResult}
        onClose={onCloseMock}
        onPrintReceipt={vi.fn()}
      />,
    )

    const closeBtn = screen.getByRole("button", { name: "Đóng" })
    fireEvent.click(closeBtn)

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })
})
