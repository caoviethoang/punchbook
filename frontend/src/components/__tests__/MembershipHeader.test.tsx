import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { MembershipHeader } from "../memberships/MembershipHeader"

afterEach(() => {
  cleanup()
})

describe("MembershipHeader", () => {
  const defaultProps = {
    meta: { page: 1, per_page: 20, total: 15, total_pages: 1 },
    isAdmin: true,
    exporting: false,
    onExport: vi.fn(),
    onOpenImportModal: vi.fn(),
    onOpenCreateModal: vi.fn(),
  }

  it("renders 'Xuất Excel' button for admin users", () => {
    render(<MembershipHeader {...defaultProps} />)
    const exportButton = screen.getByRole("button", { name: /Xuất Excel/i })
    expect(exportButton).toBeInTheDocument()
    expect(exportButton).not.toBeDisabled()
  })

  it("does not render 'Xuất Excel' button for non-admin users", () => {
    render(<MembershipHeader {...defaultProps} isAdmin={false} />)
    const exportButton = screen.queryByRole("button", { name: /Xuất Excel/i })
    expect(exportButton).not.toBeInTheDocument()
  })

  it("triggers onExport callback when clicked", () => {
    const onExport = vi.fn()
    render(<MembershipHeader {...defaultProps} onExport={onExport} />)
    const exportButton = screen.getByRole("button", { name: /Xuất Excel/i })
    fireEvent.click(exportButton)
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it("disables button and shows 'Đang xuất...' during export", () => {
    render(<MembershipHeader {...defaultProps} exporting={true} />)
    const exportButton = screen.getByRole("button", { name: /Đang xuất.../i })
    expect(exportButton).toBeInTheDocument()
    expect(exportButton).toBeDisabled()
  })
})
