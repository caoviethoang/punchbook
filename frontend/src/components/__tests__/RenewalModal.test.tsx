import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { RenewalModal } from "../RenewalModal"
import * as packagesApi from "../../lib/packages"
import * as settingsApi from "../../lib/settings"
import * as membershipsApi from "../../lib/memberships"
import type { Membership } from "../../lib/memberships"
import type { PackageItem } from "../../lib/packages"
import type { SettingsData } from "../../lib/settings"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("RenewalModal component", () => {
  const dummyMember: Membership = {
    id: "m-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    sessions_left: 0,
    expires_at: null,
    package: {
      id: "pkg-1",
      name: "Gói 10 buổi",
      price: 1000000,
      sessions_count: 10,
    },
  }

  const dummyPackages: PackageItem[] = [
    {
      id: "pkg-1",
      name: "Gói 10 buổi",
      price: 1000000,
      sessions_count: 10,
      duration_days: null,
    },
    {
      id: "pkg-2",
      name: "Gói 30 ngày Gym",
      price: 800000,
      sessions_count: null,
      duration_days: 30,
    },
  ]

  const dummySettings: SettingsData = {
    shop: {
      id: "shop-1",
      name: "Spa Lan",
      email: "lan@example.com",
      plan: "paid",
      bank_name: "MB Bank",
      bank_account_no: "0901234567",
      bank_account_name: "NGUYEN VAN A",
    },
    staffs: [],
  }

  beforeEach(() => {
    vi.spyOn(packagesApi, "listPackages").mockResolvedValue(dummyPackages)
    vi.spyOn(settingsApi, "fetchSettings").mockResolvedValue(dummySettings)
  })

  it("renders member info and loads packages", async () => {
    render(
      <RenewalModal
        membership={dummyMember}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText("Gia hạn hội viên")).toBeInTheDocument()
      expect(screen.getByText(/Nguyen Van A/)).toBeInTheDocument()
      expect(screen.getByLabelText("Chọn gói gia hạn")).toBeInTheDocument()
    })

    expect(screen.getAllByText(/1.000.000 VNĐ/).length).toBeGreaterThanOrEqual(1)
  })

  it("submits renewal with selected package and auto check-in", async () => {
    const renewSpy = vi.spyOn(membershipsApi, "renewMembership").mockResolvedValue({
      membership: { ...dummyMember, sessions_left: 9 },
      invoice: { id: "inv-1", amount: 1000000, status: "paid" },
      check_in: { id: "ci-1", checked_in_at: "2026-10-22T10:00:00Z" },
    })
    const onSuccessMock = vi.fn()

    render(
      <RenewalModal
        membership={dummyMember}
        onClose={vi.fn()}
        onSuccess={onSuccessMock}
        initialAutoCheckIn={true}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Gia hạn & Check-in ngay/i })).toBeInTheDocument()
    })

    const submitBtn = screen.getByRole("button", { name: /Gia hạn & Check-in ngay/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(renewSpy).toHaveBeenCalledWith("m-1", {
        package_id: "pkg-1",
        staff_id: undefined,
        auto_check_in: true,
      })
      expect(onSuccessMock).toHaveBeenCalledTimes(1)
    })
  })

  it("allows switching package and toggling auto check-in off", async () => {
    const renewSpy = vi.spyOn(membershipsApi, "renewMembership").mockResolvedValue({
      membership: { ...dummyMember, package: dummyPackages[1], sessions_left: null, expires_at: "2026-11-21" },
      invoice: { id: "inv-2", amount: 800000, status: "paid" },
      check_in: null,
    })
    const onSuccessMock = vi.fn()

    render(
      <RenewalModal
        membership={dummyMember}
        onClose={vi.fn()}
        onSuccess={onSuccessMock}
        initialAutoCheckIn={true}
      />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText("Chọn gói gia hạn")).toBeInTheDocument()
    })

    const select = screen.getByLabelText("Chọn gói gia hạn")
    fireEvent.change(select, { target: { value: "pkg-2" } })

    const autoCheckInCheckbox = screen.getByRole("checkbox")
    fireEvent.click(autoCheckInCheckbox)

    const submitBtn = screen.getByRole("button", { name: /Xác nhận gia hạn/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(renewSpy).toHaveBeenCalledWith("m-1", {
        package_id: "pkg-2",
        staff_id: undefined,
        auto_check_in: false,
      })
      expect(onSuccessMock).toHaveBeenCalledTimes(1)
    })
  })

  it("displays error message when renewMembership fails", async () => {
    vi.spyOn(membershipsApi, "renewMembership").mockRejectedValue(new Error("Gói tập không hợp lệ"))

    render(
      <RenewalModal
        membership={dummyMember}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Gia hạn & Check-in ngay/i })).toBeInTheDocument()
    })

    const submitBtn = screen.getByRole("button", { name: /Gia hạn & Check-in ngay/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText("Gói tập không hợp lệ")).toBeInTheDocument()
    })
  })
})
