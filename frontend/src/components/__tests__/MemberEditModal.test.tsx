import { render, screen, cleanup, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { MemberEditModal } from "../MemberEditModal"
import * as membershipsApi from "../../lib/memberships"

describe("MemberEditModal", () => {
  const dummyMembership: membershipsApi.Membership = {
    id: "m-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    email: "a@example.com",
    date_of_birth: "1995-05-20",
    sessions_left: 10,
    expires_at: null,
    package: {
      id: "pkg-1",
      name: "Gói 10 buổi",
      sessions_count: 10,
    },
    checked_in_today: false,
    last_checked_in_at: null,
  }

  const dummyPackages = [
    {
      id: "pkg-1",
      name: "Gói 10 buổi",
      sessions_count: 10,
      price: 500000,
    },
  ]

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("renders with existing date of birth populated", () => {
    render(
      <MemberEditModal
        membership={dummyMembership}
        packages={dummyPackages}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue("1995-05-20")).toBeInTheDocument()
  })

  it("submits updated date of birth when saved", async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const updateSpy = vi.spyOn(membershipsApi, "updateMembership").mockResolvedValue({
      ...dummyMembership,
      date_of_birth: "1996-06-15",
    })

    render(
      <MemberEditModal
        membership={dummyMembership}
        packages={dummyPackages}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />,
    )

    const dobInput = screen.getByDisplayValue("1995-05-20")
    await user.clear(dobInput)
    await user.type(dobInput, "1996-06-15")

    await user.click(screen.getByRole("button", { name: /Lưu/i }))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        "m-1",
        expect.objectContaining({
          date_of_birth: "1996-06-15",
        }),
      )
    })

    expect(onSuccess).toHaveBeenCalled()
  })
})
