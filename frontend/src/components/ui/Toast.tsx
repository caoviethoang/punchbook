import { useEffect } from "react"
import { AlertCircle, CheckCircle2, X } from "lucide-react"

export interface ToastProps {
  message: string
  type?: "success" | "error"
  onClose: () => void
  duration?: number
}

export function Toast({
  message,
  type = "success",
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const isSuccess = type === "success"

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-6 right-6 z-50 flex max-w-md items-center gap-3 rounded-2xl px-5 py-3.5 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
        isSuccess
          ? "border border-emerald-500/30 bg-emerald-600 text-white shadow-emerald-950/20 dark:bg-emerald-600"
          : "border border-red-500/30 bg-red-600 text-white shadow-red-950/20 dark:bg-red-600"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-100" />
      ) : (
        <AlertCircle className="h-6 w-6 shrink-0 text-red-100" />
      )}
      <p className="flex-1 text-base font-semibold leading-snug">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng thông báo"
        className="rounded-lg p-1 text-white/80 transition hover:bg-black/10 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

