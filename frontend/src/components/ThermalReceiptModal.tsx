import { useEffect } from "react"
import { createPortal } from "react-dom"
import { Printer, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { formatDateTime } from "../lib/formatters"
import { Modal } from "./ui/Modal"

export interface ReceiptData {
  shopName: string
  shopAddress?: string | null
  shopPhone?: string | null
  customerName: string
  customerPhone: string
  packageName: string
  sessionsLeft: number | null
  expiresAt?: string | null
  checkedInAt: string
  staffName?: string | null
}

interface ThermalReceiptModalProps {
  receipt: ReceiptData
  onClose: () => void
}

function ThermalReceiptContent({ receipt }: { receipt: ReceiptData }) {
  const { t } = useTranslation()

  return (
    <div className="receipt-container text-xs font-mono leading-relaxed text-slate-900 dark:text-slate-100">
      {/* Shop Header */}
      <div className="text-center pb-1">
        <h2 className="text-base font-black uppercase tracking-wide">
          {receipt.shopName}
        </h2>
        {receipt.shopAddress && (
          <p className="text-[11px] text-slate-600 dark:text-slate-400 receipt-secondary">
            {receipt.shopAddress}
          </p>
        )}
        {receipt.shopPhone && (
          <p className="text-[11px] text-slate-600 dark:text-slate-400 receipt-secondary">
            {t("receipt.phone", "SĐT:")} {receipt.shopPhone}
          </p>
        )}
        <div className="mt-2 text-xs font-black uppercase tracking-wider receipt-title">
          {t("receipt.checkin_confirmation", "PHIẾU XÁC NHẬN CHECK-IN")}
        </div>
      </div>

      {/* Header Divider */}
      <div className="receipt-divider border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />

      {/* Content Details */}
      <div className="py-1 space-y-1.5">
        <div className="flex justify-between items-start gap-2">
          <span className="text-slate-600 dark:text-slate-400 receipt-secondary shrink-0">
            {t("receipt.time", "Thời gian:")}
          </span>
          <span className="font-bold text-right">{formatDateTime(receipt.checkedInAt)}</span>
        </div>
        <div className="flex justify-between items-start gap-2">
          <span className="text-slate-600 dark:text-slate-400 receipt-secondary shrink-0">
            {t("receipt.member", "Hội viên:")}
          </span>
          <span className="font-bold text-right">{receipt.customerName}</span>
        </div>
        <div className="flex justify-between items-start gap-2">
          <span className="text-slate-600 dark:text-slate-400 receipt-secondary shrink-0">
            {t("receipt.phone", "SĐT:")}
          </span>
          <span className="text-right font-medium">{receipt.customerPhone}</span>
        </div>
        <div className="flex justify-between items-start gap-2">
          <span className="text-slate-600 dark:text-slate-400 receipt-secondary shrink-0">
            {t("receipt.package", "Gói cước:")}
          </span>
          <span className="font-semibold text-right break-words max-w-[65%]">
            {receipt.packageName}
          </span>
        </div>
      </div>

      {/* Sessions Remaining Divider */}
      <div className="receipt-divider border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />

      {/* Summary Highlight */}
      <div className="py-1 space-y-1.5">
        <div className="flex justify-between items-center text-sm font-bold">
          <span>{t("receipt.remaining", "Buổi còn lại:")}</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-black text-base receipt-highlight">
            {receipt.sessionsLeft !== null
              ? `${receipt.sessionsLeft} ${t("receipt.sessions_suffix", "buổi")}`
              : t("receipt.unlimited", "Không giới hạn")}
          </span>
        </div>

        {receipt.staffName && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 dark:text-slate-400 receipt-secondary shrink-0">
              {t("receipt.cashier", "Thu ngân:")}
            </span>
            <span className="font-medium text-right">{receipt.staffName}</span>
          </div>
        )}
      </div>

      {/* Footer Divider */}
      <div className="receipt-divider border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />

      {/* Footer */}
      <div className="pt-1 text-center text-[10px] text-slate-500 dark:text-slate-400 receipt-secondary space-y-0.5">
        <p>{t("receipt.thank_you", "Cảm ơn quý khách!")}</p>
        <p>{t("receipt.tagline", "PunchBook - Quản lý hội viên dễ dàng")}</p>
      </div>
    </div>
  )
}

export function ThermalReceiptModal({ receipt, onClose }: ThermalReceiptModalProps) {
  const { t } = useTranslation()

  const handlePrint = () => {
    window.print()
  }

  // Trigger print dialog on load
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Print stylesheet for 80mm POS Thermal Receipt */}
      <style>{`
        @media print {
          @page {
            size: 80mm 140mm;
            margin: 0;
          }

          /* Hide entire screen UI and any open dialog overlays */
          #root,
          [role="dialog"] {
            display: none !important;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 80mm !important;
            height: 140mm !important;
            max-width: 80mm !important;
            max-height: 140mm !important;
            overflow: hidden !important;
          }

          #thermal-receipt-print-root {
            display: block !important;
            position: static !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 5mm 4mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
            box-sizing: border-box !important;
          }

          #thermal-receipt-print-root * {
            color: #000000 !important;
            border-color: #000000 !important;
            background-color: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          #thermal-receipt-print-root .receipt-divider {
            border-top: 1px dashed #000000 !important;
            border-bottom: none !important;
            border-left: none !important;
            border-right: none !important;
            margin: 6px 0 !important;
          }

          #thermal-receipt-print-root .receipt-secondary {
            color: #222222 !important;
          }

          #thermal-receipt-print-root .receipt-highlight {
            font-weight: 900 !important;
            font-size: 13px !important;
            color: #000000 !important;
          }

          #thermal-receipt-print-root .receipt-title {
            font-weight: 900 !important;
            font-size: 12px !important;
            letter-spacing: 0.05em !important;
          }
        }
      `}</style>

      {/* Screen Preview Modal */}
      <Modal isOpen={true} onClose={onClose} maxWidthClass="max-w-md" className="print:hidden" hideCloseButton>
        <div className="flex flex-col">
          {/* Top Header - Screen Only */}
          <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("receipt.preview_title", "Xem trước phiếu in")}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>{t("receipt.print_now", "In ngay")}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("receipt.close", "Đóng")}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Printable Receipt Preview Container */}
          <div className="p-6 overflow-y-auto max-h-[75vh]">
            <div
              id="thermal-receipt-printable"
              className="mx-auto w-[280px] rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-sm font-mono text-xs leading-relaxed dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <ThermalReceiptContent receipt={receipt} />
            </div>
          </div>
        </div>
      </Modal>

      {/* Direct Body Portal for Clean Print Output without Modal Overflow Clipping */}
      {typeof document !== "undefined" &&
        createPortal(
          <div id="thermal-receipt-print-root" className="hidden print:block" aria-hidden="true">
            <ThermalReceiptContent receipt={receipt} />
          </div>,
          document.body,
        )}
    </>
  )
}
