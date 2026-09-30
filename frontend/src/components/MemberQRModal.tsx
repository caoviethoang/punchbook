import { useState } from "react"
import { QrCode, Copy, Check, Printer, X, ShieldCheck } from "lucide-react"
import type { Membership } from "../lib/memberships"

interface MemberQRModalProps {
  membership: Membership | null
  onClose: () => void
}

export function MemberQRModal({ membership, onClose }: MemberQRModalProps) {
  const [copied, setCopied] = useState(false)

  if (!membership) return null

  const qrValue = membership.qr_code_value || `PUNCHBOOK:${membership.id}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    qrValue,
  )}`

  function handleCopy() {
    void navigator.clipboard.writeText(qrValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-slate-800 dark:bg-slate-900">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Đóng</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Mã QR Hội viên
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dùng để quét điểm danh tự động
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800/80 dark:bg-slate-950/50">
          {/* QR Image Container */}
          <div className="group relative flex h-48 w-48 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <img
              src={qrImageUrl}
              alt={`Mã QR của ${membership.customer_name}`}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Member Details Card */}
          <div className="mt-5 w-full text-center">
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
              {membership.customer_name}
            </h4>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-600 dark:text-slate-400">
              {membership.phone}
            </p>

            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {membership.package.name}
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-white p-2.5 text-center font-mono text-xs text-slate-500 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Mã: <span className="font-semibold text-slate-700 dark:text-slate-200">{membership.id}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-500" />
                <span>Sao chép mã</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            <Printer className="h-4 w-4" />
            <span>In thẻ QR</span>
          </button>
        </div>
      </div>
    </div>
  )
}
