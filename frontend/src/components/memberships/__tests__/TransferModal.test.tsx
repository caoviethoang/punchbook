import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { TransferModal } from "../TransferModal"
import * as membershipsApi from "../../../lib/memberships"
import type { Membership, TransferMembershipResult } from "../../../lib/memberships"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("TransferModal component", () => {
  const dummyMember: Membership = {
    id: "m-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    sessions_left: 5,
    expires_at: null,
    package: {
      id: "pkg-1",
      name: "Gói 10 buổi",
      price: 1000000,
      sessions_count: 10,
    },
  }

  it("renders source member information and inputs", () => {
    render(<TransferModal membership={dummyMember} onClose={vi.fn()} />)

    expect(screen.getByText("Chuyển nhượng thẻ tập")).toBeInTheDocument()
    expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    expect(screen.getByText("0901234567")).toBeInTheDocument()
    expect(screen.getByText("Gói 10 buổi")).toBeInTheDocument()
    expect(screen.getByLabelText(/Tên hội viên nhận/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Số điện thoại người nhận/i)).toBeInTheDocument()
  })

  it("validates self-transfer when entering member's own phone number", async () => {
    render(<TransferModal membership={dummyMember} onClose={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/Tên hội viên nhận/i), {
      target: { value: "Nguyen Van A" },
    })
    fireEvent.change(screen.getByLabelText(/Số điện thoại người nhận/i), {
      target: { value: "0901234567" },
    })

    fireEvent.click(screen.getByRole("button", { name: /Xác nhận chuyển/i }))

    await waitFor(() => {
      expect(
        screen.getByText("Không thể chuyển nhượng cho chính số điện thoại của hội viên này."),
      ).toBeInTheDocument()
    })
  })

  it("disables transfer for exhausted memberships", () => {
    const exhaustedMember: Membership = {
      ...dummyMember,
      sessions_left: 0,
    }

    render(<TransferModal membership={exhaustedMember} onClose={vi.fn()} />)

    expect(
      screen.getByText(/Thẻ tập đã hết hạn hoặc hết số buổi còn lại/i),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Xác nhận chuyển/i })).toBeDisabled()
  })

  it("disables transfer for already transferred memberships", () => {
    const transferredMember: Membership = {
      ...dummyMember,
      status: "transferred",
      is_transferred: true,
    }

    render(<TransferModal membership={transferredMember} onClose={vi.fn()} />)

    expect(
      screen.getByText(/Thẻ tập này đã được chuyển nhượng trước đó/i),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Xác nhận chuyển/i })).toBeDisabled()
  })

  it("successfully submits transfer and displays success view", async () => {
    const mockResult: TransferMembershipResult = {
      source_membership: { ...dummyMember, sessions_left: 0, status: "transferred" },
      target_membership: {
        id: "m-2",
        customer_name: "Tran Thi B",
        phone: "0988888888",
        sessions_left: 5,
        expires_at: null,
        package: dummyMember.package,
      },
      transfer: {
        id: "tf-1",
        shop_id: "shop-1",
        source_membership_id: "m-1",
        target_membership_id: "m-2",
        sessions_transferred: 5,
        days_transferred: null,
        fee: 50000,
        note: "Chuyển nhượng bạn bè",
        created_at: new Date().toISOString(),
      },
      message: "Chuyển nhượng thẻ hội viên thành công",
    }

    const transferSpy = vi
      .spyOn(membershipsApi, "transferMembership")
      .mockResolvedValueOnce(mockResult)
    const onSuccessMock = vi.fn()

    render(
      <TransferModal
        membership={dummyMember}
        onClose={vi.fn()}
        onSuccess={onSuccessMock}
        staffId="staff-123"
      />,
    )

    fireEvent.change(screen.getByLabelText(/Tên hội viên nhận/i), {
      target: { value: "Tran Thi B" },
    })
    fireEvent.change(screen.getByLabelText(/Số điện thoại người nhận/i), {
      target: { value: "0988888888" },
    })
    fireEvent.change(screen.getByLabelText(/Phí chuyển nhượng/i), {
      target: { value: "50,000" },
    })
    fireEvent.change(screen.getByLabelText(/Ghi chú/i), {
      target: { value: "Chuyển nhượng bạn bè" },
    })

    fireEvent.click(screen.getByRole("button", { name: /Xác nhận chuyển/i }))

    await waitFor(() => {
      expect(screen.getByText("Chuyển nhượng thành công!")).toBeInTheDocument()
    })

    expect(transferSpy).toHaveBeenCalledWith("m-1", {
      target_customer_name: "Tran Thi B",
      target_phone: "0988888888",
      staff_id: "staff-123",
      transfer_fee: 50000,
      note: "Chuyển nhượng bạn bè",
    })
    expect(onSuccessMock).toHaveBeenCalledWith(mockResult)
    expect(screen.getAllByText(/Tran Thi B/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/5 buổi/)).toBeInTheDocument()
  })
})
