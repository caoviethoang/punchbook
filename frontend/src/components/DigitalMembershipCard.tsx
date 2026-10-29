import { useEffect, useState } from "react"
import { Check, Copy, Download, Loader2, Printer, QrCode, ShieldCheck, Sparkles } from "lucide-react"
import type { Membership, MembershipDetail } from "../lib/memberships"
import { remainingLabel } from "../lib/formatters"
import { StatusBadge } from "./ui/StatusBadge"
import {
  downloadMembershipCardPng,
  generateQRCodeDataUrl,
} from "../lib/digitalCardGenerator"

export interface DigitalMembershipCardProps {
  membership: Membership | MembershipDetail
  shopName?: string
  showActions?: boolean
  className?: string
}

export function DigitalMembershipCard({
  membership,
  shopName,
  showActions = true,
  className = "",
}: DigitalMembershipCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const effectiveShopName = membership.shop?.name || shopName || "PunchBook Spa"
  const qrValue = membership.qr_code_value || `PUNCHBOOK:${membership.id}`

  useEffect(() => {
    let isCancelled = false
    generateQRCodeDataUrl(qrValue)
      .then((url) => {
        if (!isCancelled) setQrDataUrl(url)
      })
      .catch((err) => {
        console.error("Failed to generate QR data URL:", err)
      })

    return () => {
      isCancelled = true
    }
  }, [qrValue])

  function handleCopy() {
    void navigator.clipboard.writeText(qrValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadMembershipCardPng({
        membership,
        shopName: effectiveShopName,
      })
    } catch (err) {
      console.error("Failed to download digital card:", err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Print stylesheet to isolate card during window.print() */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 10mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            overflow: visible !important;
            height: auto !important;
          }
          body * {
            visibility: hidden !important;
          }
          div[role="dialog"],
          div[role="dialog"] > div,
          [class*="overflow-"] {
            position: static !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            backdrop-filter: none !important;
            transform: none !important;
          }
          #digital-membership-card-print-area,
          #digital-membership-card-print-area * {
            visibility: visible !important;
          }
          #digital-membership-card-print-area {
            position: static !important;
            display: block !important;
            margin: 20px auto !important;
            width: 380px !important;
            max-width: 380px !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Digital Card */}
      <div
        id="digital-membership-card-print-area"
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 text-white shadow-2xl transition hover:border-indigo-400/50"
      >
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl" />

        {/* Card Header: Brand, Shop name & Tag */}
        <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-indigo-300">
                <Sparkles className="h-3 w-3" />
                <span>PUNCHBOOK</span>
              </div>
              <h4 className="text-base font-extrabold leading-tight text-white line-clamp-1">
                {effectiveShopName}
              </h4>
            </div>
          </div>

          <span className="rounded-full border border-indigo-400/30 bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-200">
            Thẻ hội viên
          </span>
        </div>

        {/* Card Center: QR Code container */}
        <div className="relative my-5 flex flex-col items-center">
          <div className="group relative flex h-52 w-52 items-center justify-center rounded-2xl bg-white p-3.5 shadow-xl transition hover:scale-[1.02]">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Mã QR thẻ hội viên của ${membership.customer_name}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="text-xs font-medium">Đang tạo mã QR...</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Quét mã QR để điểm danh tức thì
          </p>
        </div>

        {/* Card Details: Customer Name, Phone, Package & Status */}
        <div className="relative text-center">
          <h3 className="text-xl font-black tracking-tight text-white">
            {membership.customer_name}
          </h3>
          <p className="mt-0.5 font-mono text-sm font-semibold tracking-wide text-slate-300">
            {membership.phone}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-400/20 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>{membership.package.name}</span>
            </span>

            {membership.status && (
              <StatusBadge status={membership.status} type="membership" />
            )}
          </div>

          <p className="mt-2.5 text-xs font-medium text-slate-300">
            {remainingLabel(membership)}
          </p>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 py-1.5 px-3 text-center font-mono text-[11px] text-slate-400">
            Mã: <span className="font-semibold text-slate-200">{membership.id}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="no-print mt-5 flex w-full max-w-sm flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Đã chép mã</span>
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
            onClick={handleDownload}
            disabled={downloading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-900/50 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Tải về PNG</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <Printer className="h-4 w-4" />
            <span>In thẻ</span>
          </button>
        </div>
      )}
    </div>
  )
}
