import { useState } from "react"
import { AlertCircle, Calendar, CheckCircle2, Loader2, PlayCircle, ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Modal } from "../ui/Modal"
import { unfreezeMembership, type Membership } from "../../lib/memberships"
import { formatDate } from "../../lib/formatters"
import { toApiError } from "../../lib/errors"

interface UnfreezeModalProps {
  membership: Membership
  isOpen: boolean
  onClose: () => void
  onSuccess?: (updatedMembership: Membership) => void
}

export function UnfreezeModal({
  membership,
  isOpen,
  onClose,
  onSuccess,
}: UnfreezeModalProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await unfreezeMembership(membership.id, {
        reason: reason.trim() || undefined,
      })
      onSuccess?.(res.membership)
      onClose()
    } catch (err: unknown) {
      setError(toApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-md">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <PlayCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t("memberships.unfreeze_modal_title", "Mở khóa thẻ hội viên")}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {membership.customer_name}
              </span>{" "}
              • {membership.phone}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-1">
                <p className="font-medium">
                  {t(
                    "memberships.unfreeze_notice",
                    "Sau khi mở khóa, hội viên có thể tiếp tục check-in bình thường.",
                  )}
                </p>
                {membership.expires_at && (
                  <p className="text-emerald-700 dark:text-emerald-400">
                    {t(
                      "memberships.unfreeze_notice_extended",
                      "Ngày hết hạn gói sẽ tự động gia hạn thêm tương ứng số ngày đã bảo lưu.",
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {membership.frozen_until && (
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{t("memberships.freeze_until_current", "Thời hạn bảo lưu hiện tại:")}</span>
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatDate(membership.frozen_until)}
              </span>
            </div>
          )}

          <div>
            <label
              htmlFor="unfreeze_reason_input"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              {t("memberships.unfreeze_reason_label", "Ghi chú / Lý do mở khóa (Tùy chọn)")}
            </label>
            <input
              id="unfreeze_reason_input"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                "memberships.unfreeze_reason_placeholder",
                "Ví dụ: Hội viên đi tập lại sớm hơn dự kiến...",
              )}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-400"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t("common.cancel", "Hủy")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <CheckCircle2 className="h-4 w-4" />
              <span>{t("memberships.unfreeze_confirm_btn", "Mở khóa thẻ")}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
