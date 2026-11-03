import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { FreezeModal } from "../FreezeModal"
import type { Membership } from "../../../lib/memberships"
import * as membershipsApi from "../../../lib/memberships"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("FreezeModal", () => {
  const dummyMember: Membership = {
    id: "mem-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    sessions_left: null,
    expires_at: "2026-12-01",
    package: {
      id: "pkg-1",
      name: "Gói 30 ngày",
      sessions_count: null,
      duration_days: 30,
      price: 500000,
    },
  }

  it("renders modal with member info and date input", () => {
    render(
      <FreezeModal
        membership={dummyMember}
        isOpen={true}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText("Bảo lưu thẻ hội viên")).toBeInTheDocument()
    expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    expect(screen.getByText(/Gói 30 ngày/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Bảo lưu đến hết ngày/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Xác nhận bảo lưu" })).toBeInTheDocument()
  })

  it("submits freeze request and calls onSuccess", async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    const updatedMember = { ...dummyMember, status: "frozen" as const, is_frozen: true }

    vi.spyOn(membershipsApi, "freezeMembership").mockResolvedValue({
      membership: updatedMember,
      message: "Bảo lưu thành công",
    })

    render(
      <FreezeModal
        membership={dummyMember}
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    )

    const reasonInput = screen.getByLabelText(/Lý do bảo lưu/i)
    fireEvent.change(reasonInput, { target: { value: "Đi du lịch" } })

    const submitBtn = screen.getByRole("button", { name: "Xác nhận bảo lưu" })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(membershipsApi.freezeMembership).toHaveBeenCalledWith(
        "mem-1",
        expect.objectContaining({
          reason: "Đi du lịch",
        }),
      )
      expect(onSuccess).toHaveBeenCalledWith(updatedMember)
      expect(onClose).toHaveBeenCalled()
    })
  })
})
