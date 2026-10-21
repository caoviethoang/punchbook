import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { CheckInHeader } from "../checkin/CheckInHeader"
import { formatStaffOptionLabel } from "../../lib/staffs"
import type { Staff } from "../../lib/auth"

afterEach(() => {
  cleanup()
})

describe("CheckInHeader", () => {
  const dummyStaffs: Staff[] = [
    { id: "staff-1", name: "Nguyễn Văn A", username: "vancool", role: "staff" },
    { id: "staff-2", name: "Trần Thị B", username: "thib", role: "staff" },
    { id: "admin-1", name: "Lê Admin", username: "admin", role: "admin" },
  ]

  it("renders non-admin staff name with badge and no dropdown", () => {
    const receptionistStaff: Staff = {
      id: "staff-1",
      name: "Nguyễn Văn A",
      username: "vancool",
      role: "staff",
    }

    render(
      <CheckInHeader
        onOpenQRScanner={vi.fn()}
        currentStaff={receptionistStaff}
        staffs={dummyStaffs}
      />,
    )

    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument()
    expect(screen.getByText("Lễ tân")).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("renders staff selector for admin and calls onSelectStaff on change", () => {
    const adminStaff: Staff = {
      id: "admin-1",
      name: "Lê Admin",
      username: "admin",
      role: "admin",
    }
    const handleSelectStaff = vi.fn()

    render(
      <CheckInHeader
        onOpenQRScanner={vi.fn()}
        currentStaff={adminStaff}
        staffs={dummyStaffs}
        selectedStaffId="staff-1"
        onSelectStaff={handleSelectStaff}
      />,
    )

    const select = screen.getByRole("combobox", {
      name: /chọn nhân viên trực ca/i,
    })
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue("staff-1")

    fireEvent.change(select, { target: { value: "staff-2" } })
    expect(handleSelectStaff).toHaveBeenCalledWith("staff-2")
  })

  it("shows loading text when loadingStaffs is true for admin", () => {
    render(
      <CheckInHeader
        onOpenQRScanner={vi.fn()}
        currentStaff={{ id: "admin-1", name: "Admin", username: null, role: "admin" }}
        loadingStaffs={true}
      />,
    )

    expect(screen.getByText(/đang tải nhân viên/i)).toBeInTheDocument()
  })

  it("triggers onOpenQRScanner when QR button is clicked", () => {
    const handleOpenQR = vi.fn()
    render(<CheckInHeader onOpenQRScanner={handleOpenQR} />)

    const qrButton = screen.getByRole("button", { name: /quét mã qr/i })
    fireEvent.click(qrButton)
    expect(handleOpenQR).toHaveBeenCalledTimes(1)
  })

  it("does not duplicate currentStaff in the dropdown when currentStaff is present in staffs", () => {
    const adminStaff: Staff = {
      id: "admin-1",
      name: "Alice Nguyen (Admin)",
      username: "alice",
      role: "admin",
    }
    const staffsWithAdmin: Staff[] = [
      adminStaff,
      { id: "staff-2", name: "Bob Tran (Lễ tân)", username: "bob", role: "staff" },
    ]

    render(
      <CheckInHeader
        onOpenQRScanner={vi.fn()}
        currentStaff={adminStaff}
        staffs={staffsWithAdmin}
        selectedStaffId="admin-1"
        onSelectStaff={vi.fn()}
      />,
    )

    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent("Alice Nguyen (Admin)")
    expect(options[0]).not.toHaveTextContent("Alice Nguyen (Admin) (Admin)")
    expect(options[1]).toHaveTextContent("Bob Tran (Lễ tân)")
    expect(options[1]).not.toHaveTextContent("Bob Tran (Lễ tân) (Lễ tân)")
  })

  describe("formatStaffOptionLabel", () => {
    it("preserves name without duplicating role suffix", () => {
      expect(formatStaffOptionLabel({ name: "Alice Nguyen (Admin)", role: "admin" })).toBe(
        "Alice Nguyen (Admin)",
      )
      expect(formatStaffOptionLabel({ name: "Bob Tran (Lễ tân)", role: "staff" })).toBe(
        "Bob Tran (Lễ tân)",
      )
    })

    it("appends role suffix when not already in name", () => {
      expect(formatStaffOptionLabel({ name: "Alice Nguyen", role: "admin" })).toBe(
        "Alice Nguyen (Admin)",
      )
      expect(formatStaffOptionLabel({ name: "Bob Tran", role: "staff" })).toBe(
        "Bob Tran (Lễ tân)",
      )
    })
  })
})
