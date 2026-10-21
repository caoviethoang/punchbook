import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { ThemeProvider } from "../../../contexts/ThemeProvider"
import { ThemeToggle } from "../ThemeToggle"

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark")
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    document.documentElement.classList.remove("dark")
  })

  it("renders with light mode label and toggles to dark mode on click", () => {
    render(
      <ThemeProvider>
        <ThemeToggle showLabel />
      </ThemeProvider>,
    )

    const button = screen.getByRole("button", { name: /Chuyển sang giao diện tối/i })
    expect(button).toBeInTheDocument()
    expect(screen.getByText("Chế độ Tối")).toBeInTheDocument()

    fireEvent.click(button)

    expect(screen.getByRole("button", { name: /Chuyển sang giao diện sáng/i })).toBeInTheDocument()
    expect(screen.getByText("Chế độ Sáng")).toBeInTheDocument()
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("supports custom className", () => {
    render(
      <ThemeProvider>
        <ThemeToggle className="custom-test-class" />
      </ThemeProvider>,
    )

    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom-test-class")
  })
})
