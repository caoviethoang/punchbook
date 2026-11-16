import { Award, Printer, Sparkles, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Membership } from "../../lib/memberships"

interface MilestoneCelebrationModalProps {
  membership: Membership
  milestone: number
  shopName?: string
  onClose: () => void
  onPrintReceipt?: () => void
}

export function MilestoneCelebrationModal({
  membership,
  milestone,
  shopName = "PunchBook",
  onClose,
  onPrintReceipt,
}: MilestoneCelebrationModalProps) {
  const { t } = useTranslation()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-200/80 bg-white p-6 shadow-2xl text-center dark:border-amber-800/60 dark:bg-slate-900">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close", "Đóng")}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Festive Header / Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 text-white shadow-lg shadow-orange-200 dark:shadow-none animate-bounce">
          <Award className="h-10 w-10" />
        </div>

        {/* Milestone Count Badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>
            {t("checkin.milestone_badge", "Cột mốc {{count}} lần check-in", { count: milestone })}
          </span>
        </div>

        {/* Title */}
        <h3
          id="milestone-title"
          className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50"
        >
          🎉 {t("checkin.milestone_title", "Chúc mừng Cột mốc!")}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("checkin.milestone_desc", "Chúc mừng {{name}} đã xuất sắc hoàn thành buổi tập thứ {{count}} tại {{shop}}!", {
            name: membership.customer_name,
            count: milestone,
            shop: shopName,
          })}
        </p>

        {/* Celebratory Note */}
        <div className="mt-4 rounded-2xl bg-amber-50/70 p-3 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {t("checkin.milestone_cheer", "Sự kiên trì của bạn là nguồn cảm hứng lớn. Hãy tiếp tục giữ vững phong độ nhé!")}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          {onPrintReceipt && (
            <button
              type="button"
              onClick={() => {
                onPrintReceipt()
                onClose()
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t("checkin.print_milestone_receipt", "In phiếu kỷ niệm")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-200 transition hover:from-amber-600 hover:to-orange-600 dark:shadow-none"
          >
            <span>{t("checkin.milestone_continue", "Tuyệt vời, tiếp tục!")}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
