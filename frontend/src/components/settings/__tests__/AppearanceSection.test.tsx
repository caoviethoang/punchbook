import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { ThemeProvider } from "../../../contexts/ThemeProvider"
import { AppearanceSection } from "../AppearanceSection"

describe("AppearanceSection", () => {
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

  it("renders light and dark theme options and allows selecting theme", () => {
    render(
      <ThemeProvider>
        <AppearanceSection />
      </ThemeProvider>,
    )

    expect(screen.getByText("Giao diện Hiển thị")).toBeInTheDocument()
    expect(screen.getByText("Chế độ Sáng")).toBeInTheDocument()
    expect(screen.getByText("Chế độ Tối")).toBeInTheDocument()

    const darkOption = screen.getByRole("button", { name: /Chế độ Tối/i })
    fireEvent.click(darkOption)

    expect(document.documentElement.classList.contains("dark")).toBe(true)

    const lightOption = screen.getByRole("button", { name: /Chế độ Sáng/i })
    fireEvent.click(lightOption)

    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })
})
