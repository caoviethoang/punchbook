import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { MembershipFilterBar } from "../memberships/MembershipFilterBar"

afterEach(() => {
  cleanup()
})

describe("MembershipFilterBar", () => {
  const baseProps = {
    query: "",
    onQueryChange: vi.fn(),
    status: "all" as const,
    onStatusChange: vi.fn(),
  }

  it("does not display 'Đã xóa' tab for non-admin staff", () => {
    render(<MembershipFilterBar {...baseProps} isAdmin={false} />)

    expect(screen.getByRole("button", { name: "Tất cả" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Còn hạn" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sắp hết" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Đã hết" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Đã xóa" })).not.toBeInTheDocument()
  })

  it("displays 'Đã xóa' tab for admin users", () => {
    render(<MembershipFilterBar {...baseProps} isAdmin={true} />)

    expect(screen.getByRole("button", { name: "Đã xóa" })).toBeInTheDocument()
  })

  it("calls onStatusChange when clicking a tab", () => {
    const onStatusChange = vi.fn()
    render(<MembershipFilterBar {...baseProps} isAdmin={true} onStatusChange={onStatusChange} />)

    fireEvent.click(screen.getByRole("button", { name: "Đã xóa" }))
    expect(onStatusChange).toHaveBeenCalledWith("deleted")

    fireEvent.click(screen.getByRole("button", { name: "Còn hạn" }))
    expect(onStatusChange).toHaveBeenCalledWith("active")
  })

  it("calls onQueryChange when user types in search box", () => {
    const onQueryChange = vi.fn()
    render(<MembershipFilterBar {...baseProps} onQueryChange={onQueryChange} />)

    const searchInput = screen.getByPlaceholderText(/Tìm theo tên hoặc số điện thoại/i)
    fireEvent.change(searchInput, { target: { value: "Nguyen" } })

    expect(onQueryChange).toHaveBeenCalledWith("Nguyen")
  })
})
