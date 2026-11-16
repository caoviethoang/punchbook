import { render, screen, cleanup, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { MembershipCreateForm } from "../MembershipCreateForm"
import * as membershipsApi from "../../lib/memberships"
import * as packagesApi from "../../lib/packages"
import * as staffsApi from "../../lib/staffs"

describe("MembershipCreateForm", () => {
  const dummyPackages: packagesApi.PackageItem[] = [
    {
      id: "pkg-1",
      name: "Gói 10 buổi",
      sessions_count: 10,
      price: 500000,
      duration_days: null,
      pt_package: false,
    },
  ]

  beforeEach(() => {
    vi.spyOn(packagesApi, "listPackages").mockResolvedValue(dummyPackages)
    vi.spyOn(staffsApi, "fetchTrainers").mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("renders form fields including date of birth", async () => {
    render(<MembershipCreateForm />)

    expect(await screen.findByRole("heading", { name: /Thêm hội viên/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Tên hội viên/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Số điện thoại/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Ngày sinh/i)).toBeInTheDocument()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("submits form with date of birth and calls createMembership", async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const createdMembership: membershipsApi.Membership = {
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
      checked_in_today: false,
      last_checked_in_at: null,
      date_of_birth: "1995-05-20",
    }

    const createSpy = vi.spyOn(membershipsApi, "createMembership").mockResolvedValue(createdMembership)

    render(<MembershipCreateForm onSuccess={onSuccess} />)

    // Wait for package to load
    await screen.findByText(/Gói 10 buổi/i)

    await user.type(screen.getByLabelText(/Tên hội viên/i), "Nguyen Van A")
    await user.type(screen.getByLabelText(/Số điện thoại/i), "0901234567")
    await user.type(screen.getByLabelText(/Ngày sinh/i), "1995-05-20")
    await user.selectOptions(screen.getByRole("combobox"), "pkg-1")

    await user.click(screen.getByRole("button", { name: /^Thêm hội viên$/i }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_name: "Nguyen Van A",
          phone: "0901234567",
          date_of_birth: "1995-05-20",
          package_id: "pkg-1",
        }),
      )
    })

    expect(onSuccess).toHaveBeenCalledWith(createdMembership)
  })
})
