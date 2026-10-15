import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { MembershipTable } from "../memberships/MembershipTable"
import type { Membership } from "../../lib/memberships"

afterEach(() => {
  cleanup()
})

describe("MembershipTable Pagination", () => {
  const dummyMember: Membership = {
    id: "mem-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    sessions_left: 5,
    expires_at: null,
    package: {
      id: "pkg-1",
      name: "Gói 10 buổi",
      sessions_count: 10,
      duration_days: null,
      price: 500000,
    },
  }

  const baseProps = {
    loading: false,
    error: null,
    memberships: [dummyMember],
    page: 2,
    debouncedQuery: "",
    status: "all" as const,
    onReload: vi.fn(),
    onPageChange: vi.fn(),
    onOpenQR: vi.fn(),
    onOpenDetail: vi.fn(),
    onOpenEdit: vi.fn(),
    onOpenDelete: vi.fn(),
  }

  it("renders page info, numbered page buttons, and prev/next buttons when total_pages > 1", () => {
    const meta = { page: 2, per_page: 20, total: 60, total_pages: 3 }
    render(<MembershipTable {...baseProps} meta={meta} page={2} />)

    expect(screen.getByText(/Hiển thị trang 2 \/ 3/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Trang sau" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Trang 1" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Trang 2" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Trang 3" })).toBeInTheDocument()

    // Page 2 should be active (aria-current="page")
    expect(screen.getByRole("button", { name: "Trang 2" })).toHaveAttribute("aria-current", "page")
  })

  it("disables 'Trang trước' on first page", () => {
    const meta = { page: 1, per_page: 20, total: 40, total_pages: 2 }
    render(<MembershipTable {...baseProps} meta={meta} page={1} />)

    const prevButton = screen.getByRole("button", { name: "Trang trước" })
    const nextButton = screen.getByRole("button", { name: "Trang sau" })

    expect(prevButton).toBeDisabled()
    expect(nextButton).not.toBeDisabled()
  })

  it("disables 'Trang sau' on last page", () => {
    const meta = { page: 3, per_page: 20, total: 60, total_pages: 3 }
    render(<MembershipTable {...baseProps} meta={meta} page={3} />)

    const prevButton = screen.getByRole("button", { name: "Trang trước" })
    const nextButton = screen.getByRole("button", { name: "Trang sau" })

    expect(prevButton).not.toBeDisabled()
    expect(nextButton).toBeDisabled()
  })

  it("calls onPageChange when clicking a page number, prev, or next", () => {
    const onPageChange = vi.fn()
    const meta = { page: 2, per_page: 20, total: 60, total_pages: 3 }
    render(<MembershipTable {...baseProps} meta={meta} page={2} onPageChange={onPageChange} />)

    // Click page 3
    fireEvent.click(screen.getByRole("button", { name: "Trang 3" }))
    expect(onPageChange).toHaveBeenCalledWith(3)

    // Click prev (page 2 - 1 = 1)
    fireEvent.click(screen.getByRole("button", { name: "Trang trước" }))
    expect(onPageChange).toHaveBeenCalledWith(1)

    // Click next (page 2 + 1 = 3)
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it("does not render pagination bar when total_pages <= 1", () => {
    const meta = { page: 1, per_page: 20, total: 10, total_pages: 1 }
    render(<MembershipTable {...baseProps} meta={meta} page={1} />)

    expect(screen.queryByText(/Hiển thị trang/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Trang trước" })).not.toBeInTheDocument()
  })
})
