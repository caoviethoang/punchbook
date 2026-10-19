import { useCallback, useEffect, useState, type ReactNode } from "react"
import {
  getInitialTheme,
  ThemeContext,
  THEME_STORAGE_KEY,
  type Theme,
} from "./themeContextDef"

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const isDark = theme === "dark"
    document.documentElement.classList.toggle("dark", isDark)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [theme])

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    if (!mediaQuery || typeof mediaQuery.addEventListener !== "function") return

    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY)
        // Only adapt to system preference if user hasn't manually set a theme
        if (!stored) {
          setThemeState(e.matches ? "dark" : "light")
        }
      } catch {
        // Ignore
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
