import { Lock, X, ArrowRight, Loader2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

interface KioskPinModalProps {
  isOpen: boolean
  title?: string
  subtitle?: string
  onSubmit: (pin: string) => Promise<boolean | void>
  onClose: () => void
}

export function KioskPinModal({
  isOpen,
  title,
  subtitle,
  onSubmit,
  onClose,
}: KioskPinModalProps) {
  const { t } = useTranslation()
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDigit = (digit: string) => {
    if (loading || pin.length >= 8) return
    setError(null)
    setPin((prev) => prev + digit)
  }

  const handleBackspace = () => {
    if (loading || pin.length === 0) return
    setError(null)
    setPin((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    if (loading) return
    setError(null)
    setPin("")
  }

  const handleSubmit = async () => {
    if (loading || !pin.trim()) return
    setLoading(true)
    setError(null)
    try {
      const success = await onSubmit(pin.trim())
      if (success === false) {
        setError(t("kiosk.invalid_pin_msg", "Mã PIN không chính xác"))
        setPin("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("kiosk.invalid_pin_msg", "Mã PIN không chính xác"))
      setPin("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kiosk-pin-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-center text-white">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close", "Đóng")}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          <Lock className="w-7 h-7" />
        </div>

        <h3 id="kiosk-pin-title" className="text-xl font-black">
          {title || t("kiosk.pin_required_title", "Nhập mã PIN Kiosk")}
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          {subtitle || t("kiosk.pin_required_subtitle", "Nhập mã PIN để mở khóa thiết bị hoặc thoát chế độ Kiosk")}
        </p>

        {/* PIN Display Dots */}
        <div className="flex items-center justify-center gap-3 my-5 h-10">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border transition-all ${
                idx < pin.length
                  ? "bg-emerald-400 border-emerald-400 scale-110 shadow-[0_0_8px_#10b981]"
                  : "bg-slate-800 border-slate-700"
              }`}
            />
          ))}
        </div>

        {error && <p className="mb-3 text-xs font-semibold text-rose-400">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              type="button"
              disabled={loading}
              onClick={() => handleDigit(d)}
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-lg font-bold transition border border-slate-700/50"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            disabled={loading || !pin}
            onClick={handleClear}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition border border-slate-700/50"
          >
            {t("kiosk.clear_short", "XÓA")}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDigit("0")}
            className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-lg font-bold transition border border-slate-700/50"
          >
            0
          </button>
          <button
            type="button"
            disabled={loading || !pin}
            onClick={handleBackspace}
            aria-label={t("kiosk.backspace", "Xóa một ký tự")}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition border border-slate-700/50"
          >
            ⌫
          </button>
        </div>

        <button
          type="button"
          disabled={loading || pin.length < 4}
          onClick={() => void handleSubmit()}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold transition disabled:opacity-30 disabled:pointer-events-none"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>{t("common.confirm", "Xác nhận")}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
