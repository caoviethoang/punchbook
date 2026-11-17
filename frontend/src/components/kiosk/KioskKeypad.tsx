import { Delete, ArrowRight, RotateCcw } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

interface KioskKeypadProps {
  value: string
  onChange: (val: string) => void
  onSubmit: (val: string) => void
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  autoSubmitLength?: number
}

export function KioskKeypad({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder,
  maxLength,
  autoSubmitLength,
}: KioskKeypadProps) {
  const { t } = useTranslation()
  const maxLen = maxLength ?? 15
  const autoLen = autoSubmitLength ?? 10

  // Format value for display with spaced grouping (e.g. 0901 234 567)
  const formatDisplay = (raw: string) => {
    if (!raw) return ""
    // If digits only, format in 4-3-3 chunks
    if (/^\d+$/.test(raw)) {
      if (raw.length <= 4) return raw
      if (raw.length <= 7) return `${raw.slice(0, 4)} ${raw.slice(4)}`
      return `${raw.slice(0, 4)} ${raw.slice(4, 7)} ${raw.slice(7, 11)}`
    }
    return raw
  }

  const handleDigit = (digit: string) => {
    if (disabled || value.length >= maxLen) return
    const next = value + digit
    onChange(next)
    // Auto-submit if target digits entered
    if (autoLen && next.length === autoLen && /^\d+$/.test(next)) {
      onSubmit(next)
    }
  }

  const handleBackspace = () => {
    if (disabled || value.length === 0) return
    onChange(value.slice(0, -1))
  }

  const handleClear = () => {
    if (disabled || value.length === 0) return
    onChange("")
  }

  const handleSubmit = () => {
    if (disabled || !value.trim()) return
    onSubmit(value.trim())
  }

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault()
        handleDigit(e.key)
      } else if (e.key === "Backspace") {
        e.preventDefault()
        handleBackspace()
      } else if (e.key === "Enter") {
        e.preventDefault()
        handleSubmit()
      } else if (e.key === "Escape") {
        e.preventDefault()
        handleClear()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Display Screen */}
      <div className="w-full mb-4">
        <div className="flex items-center justify-between h-16 px-5 rounded-2xl bg-slate-900/90 dark:bg-slate-950 border border-slate-700/80 text-white shadow-inner">
          <div className="flex-1 text-center font-mono text-2xl sm:text-3xl font-black tracking-wider text-emerald-400 min-h-[2rem]">
            {value ? formatDisplay(value) : (
              <span className="text-slate-500 font-normal text-base sm:text-lg">
                {placeholder || t("kiosk.enter_phone_placeholder", "Nhập SĐT hoặc quẹt thẻ")}
              </span>
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              aria-label={t("kiosk.clear", "Xóa hết")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Numeric Touch Grid */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(digit)}
            className="flex items-center justify-center h-16 sm:h-18 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white text-2xl font-black shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none border border-slate-700/60"
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          disabled={disabled || !value}
          onClick={handleClear}
          className="flex items-center justify-center h-16 sm:h-18 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none border border-slate-700/60 uppercase"
        >
          {t("kiosk.clear_short", "XÓA")}
        </button>

        {/* 0 Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit("0")}
          className="flex items-center justify-center h-16 sm:h-18 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white text-2xl font-black shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none border border-slate-700/60"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          disabled={disabled || !value}
          onClick={handleBackspace}
          aria-label={t("kiosk.backspace", "Xóa một ký tự")}
          className="flex items-center justify-center h-16 sm:h-18 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none border border-slate-700/60"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* Big Submit Button */}
      <button
        type="button"
        disabled={disabled || !value.trim()}
        onClick={handleSubmit}
        className="mt-4 flex items-center justify-center gap-2 w-full h-14 sm:h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-98 text-white text-lg font-bold shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-30 disabled:pointer-events-none"
      >
        <span>{t("kiosk.check_in_btn", "Check-in ngay")}</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
