import { render, screen, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { MilestoneCelebrationModal } from "../MilestoneCelebrationModal"
import type { Membership } from "../../../lib/memberships"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("MilestoneCelebrationModal", () => {
  const dummyMember: Membership = {
    id: "m-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    sessions_left: 10,
    expires_at: null,
    package: {
      id: "pkg-1",
      name: "Gói 10 buổi",
      sessions_count: 10,
    },
    checked_in_today: true,
    last_checked_in_at: "2026-11-16T10:00:00Z",
    total_check_ins_count: 50,
  }

  it("renders celebration modal with milestone info and member name", () => {
    render(
      <MilestoneCelebrationModal
        membership={dummyMember}
        milestone={50}
        shopName="PunchBook Gym"
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(/Cột mốc 50 lần check-in/i)).toBeInTheDocument()
    expect(screen.getByText(/Chúc mừng Cột mốc!/i)).toBeInTheDocument()
    expect(screen.getByText(/Nguyen Van A/i)).toBeInTheDocument()
    expect(screen.getByText(/PunchBook Gym/i)).toBeInTheDocument()
  })

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup()
    const onCloseMock = vi.fn()

    render(
      <MilestoneCelebrationModal
        membership={dummyMember}
        milestone={50}
        onClose={onCloseMock}
      />,
    )

    const closeBtn = screen.getByRole("button", { name: /Đóng/i })
    await user.click(closeBtn)

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when continue button is clicked", async () => {
    const user = userEvent.setup()
    const onCloseMock = vi.fn()

    render(
      <MilestoneCelebrationModal
        membership={dummyMember}
        milestone={50}
        onClose={onCloseMock}
      />,
    )

    const continueBtn = screen.getByRole("button", { name: /Tuyệt vời, tiếp tục!/i })
    await user.click(continueBtn)

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it("calls onPrintReceipt and onClose when print receipt button is clicked", async () => {
    const user = userEvent.setup()
    const onCloseMock = vi.fn()
    const onPrintReceiptMock = vi.fn()

    render(
      <MilestoneCelebrationModal
        membership={dummyMember}
        milestone={50}
        onClose={onCloseMock}
        onPrintReceipt={onPrintReceiptMock}
      />,
    )

    const printBtn = screen.getByRole("button", { name: /In phiếu kỷ niệm/i })
    await user.click(printBtn)

    expect(onPrintReceiptMock).toHaveBeenCalledTimes(1)
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })
})
