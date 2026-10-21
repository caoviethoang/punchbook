import { Moon, Sun } from "lucide-react"
import { useTheme } from "../../hooks/useTheme"

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 sm:p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-500 transition-transform duration-200" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600 transition-transform duration-200" />
      )}
      {showLabel && (
        <span className="text-xs font-semibold sm:text-sm">
          {isDark ? "Chế độ Sáng" : "Chế độ Tối"}
        </span>
      )}
    </button>
  )
}
