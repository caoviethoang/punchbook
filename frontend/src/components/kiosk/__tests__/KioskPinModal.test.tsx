import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { KioskPinModal } from "../KioskPinModal"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("KioskPinModal", () => {
  it("renders unlock title and digit dots", () => {
    render(<KioskPinModal isOpen={true} mode="unlock" onClose={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(/Nhập mã PIN Kiosk/i)).toBeInTheDocument()
  })

  it("handles keypad input and allows submitting", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true)
    render(<KioskPinModal isOpen={true} mode="unlock" onClose={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole("button", { name: /^1$/ }))
    fireEvent.click(screen.getByRole("button", { name: /^2$/ }))
    fireEvent.click(screen.getByRole("button", { name: /^3$/ }))
    fireEvent.click(screen.getByRole("button", { name: /^4$/ }))

    const submitBtn = screen.getByRole("button", { name: /Xác nhận|kiosk\.confirm/i })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("1234")
    })
  })

  it("displays error when onSubmit returns false", async () => {
    const onSubmit = vi.fn().mockResolvedValue(false)
    render(<KioskPinModal isOpen={true} mode="unlock" onClose={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole("button", { name: /^9$/ }))
    fireEvent.click(screen.getByRole("button", { name: /^9$/ }))
    fireEvent.click(screen.getByRole("button", { name: /^9$/ }))
    fireEvent.click(screen.getByRole("button", { name: /^9$/ }))

    fireEvent.click(screen.getByRole("button", { name: /Xác nhận|kiosk\.confirm/i }))

    await waitFor(() => {
      expect(screen.getByText(/Mã PIN không chính xác/i)).toBeInTheDocument()
    })
  })

  it("calls onClose when cancel button is clicked", () => {
    const onClose = vi.fn()
    render(<KioskPinModal isOpen={true} mode="unlock" onClose={onClose} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: /Đóng/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
