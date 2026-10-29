import { useEffect } from "react"
import { createPortal } from "react-dom"
import { Printer, X } from "lucide-react"
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
  return (
    <>
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700 receipt-dashed-divider">
        <h2 className="text-base font-extrabold uppercase tracking-wide">
          {receipt.shopName}
        </h2>
        {receipt.shopAddress && (
          <p className="text-[11px] text-slate-600 dark:text-slate-400 receipt-subtext">
            {receipt.shopAddress}
          </p>
        )}
        {receipt.shopPhone && (
          <p className="text-[11px] text-slate-600 dark:text-slate-400 receipt-subtext">
            SĐT: {receipt.shopPhone}
          </p>
        )}
        <div className="mt-2 text-sm font-bold uppercase tracking-wider receipt-title">
          PHIẾU XÁC NHẬN CHECK-IN
        </div>
      </div>

      {/* Content Details */}
      <div className="py-3 space-y-1.5">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400 receipt-label">Thời gian:</span>
          <span className="font-bold">{formatDateTime(receipt.checkedInAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400 receipt-label">Hội viên:</span>
          <span className="font-bold">{receipt.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400 receipt-label">SĐT:</span>
          <span>{receipt.customerPhone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400 receipt-label">Gói cước:</span>
          <span className="font-semibold text-right max-w-[150px] truncate">
            {receipt.packageName}
          </span>
        </div>

        <div className="my-2 border-t border-dashed border-slate-300 dark:border-slate-700 receipt-dashed-divider" />

        <div className="flex justify-between text-sm font-bold">
          <span>Buổi còn lại:</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-extrabold receipt-highlight">
            {receipt.sessionsLeft !== null
              ? `${receipt.sessionsLeft} buổi`
              : "Không giới hạn"}
          </span>
        </div>

        {receipt.staffName && (
          <div className="flex justify-between text-[11px] pt-1">
            <span className="text-slate-500 dark:text-slate-400 receipt-label">Thu ngân:</span>
            <span>{receipt.staffName}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 text-center text-[10px] text-slate-500 dark:text-slate-400 receipt-dashed-divider receipt-footer">
        <p>Cảm ơn quý khách!</p>
        <p>PunchBook - Quản lý hội viên dễ dàng</p>
      </div>
    </>
  )
}

export function ThermalReceiptModal({ receipt, onClose }: ThermalReceiptModalProps) {
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
      {/* Print stylesheet */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm;
          }

          /* Hide everything in #root and any open modals */
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
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }

          #thermal-receipt-print-root {
            display: block !important;
            position: static !important;
            width: 76mm !important;
            max-width: 76mm !important;
            margin: 0 auto !important;
            padding: 4mm 3mm !important;
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

          #thermal-receipt-print-root .receipt-dashed-divider {
            border-top: 1px dashed #000000 !important;
            margin: 6px 0 !important;
          }

          #thermal-receipt-print-root .receipt-subtext,
          #thermal-receipt-print-root .receipt-label,
          #thermal-receipt-print-root .receipt-footer {
            color: #222222 !important;
          }

          #thermal-receipt-print-root .receipt-highlight {
            font-weight: 900 !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Screen Preview Modal */}
      <Modal isOpen={true} onClose={onClose} maxWidthClass="max-w-md" className="print:hidden">
        <div className="flex flex-col">
          {/* Top Header - Screen Only */}
          <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Xem trước phiếu in
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <Printer className="h-4 w-4" />
                In ngay
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
