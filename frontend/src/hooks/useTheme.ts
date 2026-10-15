import { useContext } from "react"
import { ThemeContext, type ThemeContextValue } from "../contexts/themeContextDef"

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    const isDark =
      typeof document !== "undefined"
        ? document.documentElement.classList.contains("dark")
        : false
    return {
      theme: isDark ? "dark" : "light",
      isDark,
      toggleTheme: () => {},
      setTheme: () => {},
    }
  }
  return context
}

export type { Theme, ThemeContextValue } from "../contexts/themeContextDef"
