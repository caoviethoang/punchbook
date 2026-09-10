import React, { useEffect } from "react"
import { X } from "lucide-react"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidthClass?: string
  className?: string
  hideCloseButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  children,
  maxWidthClass = "max-w-md",
  className = "",
  hideCloseButton = false,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={`relative w-full ${maxWidthClass} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 ${className}`}
      >
        {!hideCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng modal"
            className="absolute right-4 top-4 z-10 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
