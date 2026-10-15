import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { CheckInHeader } from "../checkin/CheckInHeader"
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
})
