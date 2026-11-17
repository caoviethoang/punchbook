import { render, screen, cleanup, fireEvent, act } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { KioskSuccessView } from "../KioskSuccessView"
import type { KioskCheckInResult } from "../../../lib/kiosk"

describe("KioskSuccessView", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers()
    })
    vi.useRealTimers()
    cleanup()
    vi.clearAllMocks()
  })

  const mockResult: KioskCheckInResult = {
    status: "success",
    message: "Check-in thành công!",
    audio_text: "Xin chào Nguyen Van A",
    membership: {
      id: "mem-1",
      customer_name: "Nguyen Van A",
      phone: "0901234567",
      package_name: "Gói Gym 1 Tháng",
      sessions_left: 15,
      expires_at: "2026-12-31T23:59:59Z",
      status: "active",
      total_check_ins_count: 20,
    },
    check_in: {
      id: "ci-1",
      checked_in_at: "2026-11-17T10:00:00Z",
    },
    milestone_reached: 20,
  }

  it("renders member name, package, sessions left, and milestone badge", () => {
    render(<KioskSuccessView result={mockResult} onReset={vi.fn()} />)

    expect(screen.getByText(/Nguyen Van A/i)).toBeInTheDocument()
    expect(screen.getByText("Gói Gym 1 Tháng")).toBeInTheDocument()
    expect(screen.getByText(/15 buổi/i)).toBeInTheDocument()
    expect(screen.getByText(/Cột mốc 20 lần check-in/i)).toBeInTheDocument()
  })

  it("renders unlimited sessions indicator when sessions_left is null and no expiry", () => {
    const unlimitedResult: KioskCheckInResult = {
      ...mockResult,
      membership: {
        ...mockResult.membership!,
        sessions_left: null,
        expires_at: null,
      },
    }

    render(<KioskSuccessView result={unlimitedResult} onReset={vi.fn()} />)
    expect(screen.getByText(/Không giới hạn/i)).toBeInTheDocument()
  })

  it("calls onReset when continue button is clicked", () => {
    const onReset = vi.fn()
    render(<KioskSuccessView result={mockResult} onReset={onReset} />)

    fireEvent.click(screen.getByRole("button", { name: /Tự động quay lại/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it("auto resets after countdown completes", () => {
    const onReset = vi.fn()
    render(<KioskSuccessView result={mockResult} onReset={onReset} autoResetSeconds={3} />)

    act(() => {
      vi.advanceTimersByTime(3100)
    })

    expect(onReset).toHaveBeenCalled()
  })
})
