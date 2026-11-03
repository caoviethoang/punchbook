import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { FreezeModal } from "../FreezeModal"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it("counts the selected final day in the duration, limit, and expiry preview", () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 2, 10))
  render(
    <FreezeModal
      membership={{
        id: "member-1",
        customer_name: "Test Member",
        phone: "0901234567",
        sessions_left: null,
        expires_at: "2026-12-01",
        package: { id: "package-1", name: "Monthly", duration_days: 30, sessions_count: null, price: 500000 },
      }}
      isOpen
      onClose={vi.fn()}
    />,
  )

  const date = screen.getByLabelText(/Bảo lưu đến hết ngày/i)
  expect(date).toHaveAttribute("max", "2026-12-01")
  fireEvent.click(screen.getByRole("button", { name: /\+7/ }))
  expect(date).toHaveValue("2026-11-08")
  expect(screen.getByText("Thời lượng: 7 ngày")).toBeInTheDocument()
  expect(screen.getByText("08/12/2026")).toBeInTheDocument()
})
