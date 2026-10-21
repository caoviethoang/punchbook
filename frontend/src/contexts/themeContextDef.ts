import { createContext } from "react"

export type Theme = "light" | "dark"

export interface ThemeContextValue {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

export const THEME_STORAGE_KEY = "punchbook_theme"

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === "dark" || stored === "light") {
      return stored
    }
  } catch {
    // Fall back to system preference if localStorage access fails
  }

  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)")?.matches ? "dark" : "light"
  }

  return "light"
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
