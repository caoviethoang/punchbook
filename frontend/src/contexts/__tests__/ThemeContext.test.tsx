import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { getInitialTheme, THEME_STORAGE_KEY } from "../themeContextDef"
import { ThemeProvider } from "../ThemeProvider"
import { useTheme } from "../../hooks/useTheme"

describe("ThemeContext & getInitialTheme", () => {
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

  it("returns stored theme from localStorage if valid", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark")
    expect(getInitialTheme()).toBe("dark")

    localStorage.setItem(THEME_STORAGE_KEY, "light")
    expect(getInitialTheme()).toBe("light")
  })

  it("prioritizes localStorage over system preference", () => {
    // System prefers dark, but localStorage has light
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    localStorage.setItem(THEME_STORAGE_KEY, "light")
    expect(getInitialTheme()).toBe("light")
  })

  it("falls back to system preference when no localStorage entry exists", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    expect(getInitialTheme()).toBe("dark")
  })

  it("toggles theme and updates document.documentElement and localStorage", () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    })

    expect(result.current.theme).toBe("light")
    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.classList.contains("dark")).toBe(false)

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe("dark")
    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe("light")
    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
  })

  it("allows setting theme explicitly with setTheme", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    })

    act(() => {
      result.current.setTheme("dark")
    })

    expect(result.current.theme).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    act(() => {
      result.current.setTheme("light")
    })

    expect(result.current.theme).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("provides safe fallback when useTheme is called outside ThemeProvider", () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current).toBeDefined()
    expect(result.current.theme).toBe("light")
    expect(result.current.isDark).toBe(false)
    // Calling toggleTheme should not crash
    expect(() => result.current.toggleTheme()).not.toThrow()
  })
})
