import { useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  QrCode,
  RefreshCw,
  X,
} from "lucide-react"
import { createInvoice, type PayosInvoiceResult } from "../lib/memberships"
import { formatVnd } from "../lib/formatters"

interface RenewalModalProps {
  membership: {
    id: string
    customer_name: string
    phone: string
    package: {
      name: string
      price?: number
    }
  }
  onClose: () => void
}

export function RenewalModal({ membership, onClose }: RenewalModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PayosInvoiceResult | null>(null)
  const [copied, setCopied] = useState(false)

  const packagePrice = membership.package.price ?? 0

  async function handleCreateInvoice() {
    setLoading(true)
    setError(null)
    try {
      const res = await createInvoice(membership.id)
      setResult(res)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Tạo hóa đơn thất bại. Vui lòng thử lại.",
      )
    } finally {
      setLoading(false)
    }
  }

  function handleCopyLink() {
    if (!result?.payos.checkout_url) return
    navigator.clipboard.writeText(result.payos.checkout_url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Construct QR image URL using VietQR format if payos returns raw QR payload or fallback to QR image API
  const qrImageUrl = result?.payos.qr_code
    ? result.payos.qr_code.startsWith("http")
      ? result.payos.qr_code
      : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(result.payos.qr_code)}`
    : result?.payos.checkout_url
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(result.payos.checkout_url)}`
      : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng modal"
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Gia hạn hội viên
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {membership.customer_name} &bull; {membership.phone}
            </p>
          </div>
        </div>

        {/* Package info card */}
        <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Gói dịch vụ:
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {membership.package.name}
            </span>
          </div>
          {packagePrice > 0 && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Giá gói:
              </span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatVnd(packagePrice)}
              </span>
            </div>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic content area */}
        {!result ? (
          <div className="mt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Nhấn nút bên dưới để khởi tạo mã QR thanh toán PayOS. Khách hàng có thể quét mã trực tiếp để gia hạn.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={handleCreateInvoice}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Đang tạo mã QR payOS...</span>
                </>
              ) : (
                <>
                  <QrCode className="h-5 w-5" />
                  <span>Tạo mã QR thanh toán</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center space-y-4">
            {/* Status indicator */}
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <span className="h-2 w-2 animate-ping rounded-full bg-amber-500" />
              <span>Trạng thái: Đang chờ thanh toán</span>
            </div>

            {/* QR Code Container */}
            {qrImageUrl && (
              <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <img
                  src={qrImageUrl}
                  alt="Mã QR thanh toán PayOS"
                  className="h-56 w-56 object-contain"
                />
                <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                  Đưa mã QR cho khách hàng quét bằng ứng dụng Ngân hàng / Momo
                </p>
              </div>
            )}

            {/* PayOS URL Links */}
            <div className="flex w-full flex-col gap-2 pt-2">
              <a
                href={result.payos.checkout_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Mở trang thanh toán PayOS</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Đã sao chép link
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Sao chép link thanh toán</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
