import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { UnfreezeModal } from "../UnfreezeModal"
import type { Membership } from "../../../lib/memberships"
import * as membershipsApi from "../../../lib/memberships"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("UnfreezeModal", () => {
  const dummyMember: Membership = {
    id: "mem-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    sessions_left: null,
    expires_at: "2026-12-01",
    status: "frozen",
    is_frozen: true,
    frozen_until: "2026-11-20",
    package: {
      id: "pkg-1",
      name: "Gói 30 ngày",
      sessions_count: null,
      duration_days: 30,
      price: 500000,
    },
  }

  it("renders modal with member info and unfreeze confirm button", () => {
    render(
      <UnfreezeModal
        membership={dummyMember}
        isOpen={true}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText("Mở khóa thẻ hội viên")).toBeInTheDocument()
    expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Mở khóa thẻ" })).toBeInTheDocument()
  })

  it("submits unfreeze request and calls onSuccess", async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    const updatedMember = { ...dummyMember, status: "active" as const, is_frozen: false }

    vi.spyOn(membershipsApi, "unfreezeMembership").mockResolvedValue({
      membership: updatedMember,
      message: "Mở khóa thành công",
    })

    render(
      <UnfreezeModal
        membership={dummyMember}
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    )

    const reasonInput = screen.getByLabelText(/Lý do mở khóa/i)
    fireEvent.change(reasonInput, { target: { value: "Đi tập sớm" } })

    const submitBtn = screen.getByRole("button", { name: "Mở khóa thẻ" })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(membershipsApi.unfreezeMembership).toHaveBeenCalledWith(
        "mem-1",
        expect.objectContaining({
          reason: "Đi tập sớm",
        }),
      )
      expect(onSuccess).toHaveBeenCalledWith(updatedMember)
      expect(onClose).toHaveBeenCalled()
    })
  })
})
