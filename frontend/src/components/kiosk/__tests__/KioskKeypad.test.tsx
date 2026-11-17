import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { KioskKeypad } from "../KioskKeypad"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("KioskKeypad", () => {
  it("renders keypad numeric buttons and action buttons", () => {
    render(<KioskKeypad value="" onChange={vi.fn()} onSubmit={vi.fn()} />)

    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole("button", { name: new RegExp(`^${i}$`) })).toBeInTheDocument()
    }
    expect(screen.getByRole("button", { name: /^XÓA$/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Xóa một ký tự|kiosk\.backspace/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Check-in ngay|kiosk\.check_in_btn/i })).toBeInTheDocument()
  })

  it("calls onChange when a digit button is clicked", () => {
    const onChange = vi.fn()
    render(<KioskKeypad value="0901" onChange={onChange} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: /^5$/ }))
    expect(onChange).toHaveBeenCalledWith("09015")
  })

  it("handles backspace button click", () => {
    const onChange = vi.fn()
    render(<KioskKeypad value="09012" onChange={onChange} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: /Xóa một ký tự|kiosk\.backspace/i }))
    expect(onChange).toHaveBeenCalledWith("0901")
  })

  it("handles clear button click", () => {
    const onChange = vi.fn()
    render(<KioskKeypad value="09012" onChange={onChange} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: /^XÓA$/i }))
    expect(onChange).toHaveBeenCalledWith("")
  })

  it("calls onSubmit when check-in button is clicked", () => {
    const onSubmit = vi.fn()
    render(<KioskKeypad value="0901234567" onChange={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole("button", { name: /Check-in ngay|kiosk\.check_in_btn/i }))
    expect(onSubmit).toHaveBeenCalledWith("0901234567")
  })

  it("auto-submits when autoSubmitLength is reached on digit input", () => {
    const onSubmit = vi.fn()
    const onChange = vi.fn()
    render(
      <KioskKeypad
        value="090123456"
        onChange={onChange}
        onSubmit={onSubmit}
        autoSubmitLength={10}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /^7$/ }))
    expect(onChange).toHaveBeenCalledWith("0901234567")
    expect(onSubmit).toHaveBeenCalled()
  })

  it("respects maxLength prop", () => {
    const onChange = vi.fn()
    render(
      <KioskKeypad
        value="1234"
        onChange={onChange}
        onSubmit={vi.fn()}
        maxLength={4}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /^5$/ }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("disables all buttons when disabled is true", () => {
    render(<KioskKeypad value="123" onChange={vi.fn()} onSubmit={vi.fn()} disabled={true} />)

    expect(screen.getByRole("button", { name: /^1$/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Check-in ngay|kiosk\.submit/i })).toBeDisabled()
  })
})
