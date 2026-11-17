import { AlertTriangle, QrCode, ArrowLeft, Loader2, CheckCircle, RefreshCw } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import { checkKioskInvoiceStatus, type KioskCheckInResult } from "../../lib/kiosk"

interface KioskDeniedViewProps {
  result: KioskCheckInResult
  onReset: () => void
  onPaidSuccess?: () => void
  kioskToken?: string
}

export function KioskDeniedView({
  result,
  onReset,
  onPaidSuccess,
  kioskToken,
}: KioskDeniedViewProps) {
  const { t } = useTranslation()
  const renewal = result.renewal
  const hasRenewal = Boolean(renewal?.vietqr_url || renewal?.invoice_id)
  const [secondsRemaining, setSecondsRemaining] = useState(hasRenewal ? 45 : 6)
  const [isPaid, setIsPaid] = useState(false)
  const isPolling = Boolean(renewal?.invoice_id && !isPaid)
  const intervalRef = useRef<number | null>(null)

  // Countdown timer
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          onReset()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [onReset])

  // Polling for invoice payment if renewal invoice exists
  useEffect(() => {
    if (!renewal?.invoice_id || isPaid) return

    intervalRef.current = window.setInterval(async () => {
      try {
        const res = await checkKioskInvoiceStatus(renewal.invoice_id, kioskToken)
        if (res.status === "paid") {
          setIsPaid(true)
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          // Notify parent of successful payment
          setTimeout(() => {
            onPaidSuccess?.()
          }, 1500)
        }
      } catch {
        // Ignore polling error, keep retrying
      }
    }, 2500)

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [kioskToken, onPaidSuccess, renewal?.invoice_id, isPaid])

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  return (
    <div
      role="region"
      aria-label={t("kiosk.denied_title", "Không thể check-in")}
      className="flex flex-col items-center justify-between w-full max-w-lg min-h-[440px] p-6 sm:p-8 mx-auto rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200 text-white"
    >
      <div className="flex flex-col items-center w-full">
        {/* Header Alert Icon */}
        <div className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-3xl border ${hasRenewal ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-rose-500/20 text-rose-400 border-rose-500/40"}`}>
          <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        {/* Reason Title */}
        <h2 className="text-xl sm:text-2xl font-black text-white">
          {result.message || t("kiosk.access_denied", "Không thể thực hiện check-in")}
        </h2>

        {result.code && (
          <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono font-medium text-slate-400 border border-slate-700">
            {t("kiosk.reason_code", "Lý do")}: {result.code}
          </span>
        )}

        {result.membership && (
          <p className="mt-1 text-sm font-semibold text-slate-300">
            {result.membership.customer_name} ({result.membership.phone})
          </p>
        )}

        {/* Renewal VietQR Section */}
        {hasRenewal && renewal && (
          <div className="w-full mt-5 p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <QrCode className="w-4 h-4" />
                <span>{t("kiosk.self_renew_title", "Gia hạn ngay tại cửa:")}</span>
              </span>
              <span className="font-extrabold text-sm text-white font-mono">
                {formatVND(renewal.amount)}
              </span>
            </div>

            {/* Paid State Overlay */}
            {isPaid ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                <p className="text-base font-black text-emerald-400">
                  {t("kiosk.payment_success", "Đã nhận thanh toán thành công!")}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {t("kiosk.auto_checking_in", "Hệ thống đang tự động check-in cho bạn...")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-3">
                {/* VietQR Image */}
                {renewal.vietqr_url && (
                  <div className="shrink-0 p-2 bg-white rounded-xl shadow-md">
                    <img
                      src={renewal.vietqr_url}
                      alt="VietQR Code"
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-1.5 text-xs text-slate-300">
                  <p>
                    <span className="text-slate-400">{t("receipt.package", "Gói cước:")}</span>{" "}
                    <strong className="text-white">{renewal.package_name}</strong>
                  </p>
                  {renewal.bank_name && (
                    <p>
                      <span className="text-slate-400">{t("settings.bank_name", "Ngân hàng:")}</span>{" "}
                      <span className="text-white">{renewal.bank_name}</span>
                    </p>
                  )}
                  {renewal.bank_account_no && (
                    <p>
                      <span className="text-slate-400">{t("settings.bank_account_no", "Số TK:")}</span>{" "}
                      <span className="font-mono font-bold text-amber-300">{renewal.bank_account_no}</span>
                    </p>
                  )}
                  {isPolling && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{t("kiosk.waiting_payment", "Chờ giao dịch chuyển khoản...")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="w-full mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("kiosk.back_to_standby", "Quay lại")} ({secondsRemaining}s)</span>
        </button>

        {hasRenewal && !isPaid && (
          <button
            type="button"
            onClick={() => {
              if (renewal?.invoice_id) {
                void checkKioskInvoiceStatus(renewal.invoice_id, kioskToken).then((res) => {
                  if (res.status === "paid") setIsPaid(true)
                })
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("kiosk.check_payment_btn", "Kiểm tra thanh toán")}</span>
          </button>
        )}
      </div>
    </div>
  )
}
