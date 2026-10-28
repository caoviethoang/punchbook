import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { LanguageToggle } from "../LanguageToggle"
import i18n, { LANGUAGE_STORAGE_KEY } from "../../../i18n"

describe("LanguageToggle", () => {
  beforeEach(async () => {
    localStorage.clear()
    await i18n.changeLanguage("vi")
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it("renders with default Vietnamese language", () => {
    render(<LanguageToggle showLabel />)

    const button = screen.getByRole("button", { name: /Chuyển sang tiếng Anh/i })
    expect(button).toBeInTheDocument()
    expect(screen.getByText("vi")).toBeInTheDocument()
    expect(screen.getByText("Tiếng Việt")).toBeInTheDocument()
  })

  it("toggles language between Vietnamese and English on click", async () => {
    render(<LanguageToggle showLabel />)

    const button = screen.getByRole("button", { name: /Chuyển sang tiếng Anh/i })
    fireEvent.click(button)

    expect(await screen.findByRole("button", { name: /Switch to Vietnamese/i })).toBeInTheDocument()
    expect(screen.getByText("en")).toBeInTheDocument()
    expect(screen.getByText("English")).toBeInTheDocument()
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en")

    // Click again to toggle back to Vietnamese
    fireEvent.click(button)
    expect(await screen.findByRole("button", { name: /Chuyển sang tiếng Anh/i })).toBeInTheDocument()
    expect(screen.getByText("vi")).toBeInTheDocument()
    expect(screen.getByText("Tiếng Việt")).toBeInTheDocument()
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("vi")
  })

  it("supports custom className", () => {
    render(<LanguageToggle className="custom-lang-class" />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom-lang-class")
  })
})
