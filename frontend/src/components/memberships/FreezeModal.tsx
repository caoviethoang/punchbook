import { useMemo, useState } from "react"
import { AlertCircle, Calendar, Clock, Loader2, PauseCircle, ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Modal } from "../ui/Modal"
import { freezeMembership, type Membership } from "../../lib/memberships"
import { formatDate } from "../../lib/formatters"
import { toApiError } from "../../lib/errors"

interface FreezeModalProps {
  membership: Membership
  isOpen: boolean
  onClose: () => void
  onSuccess?: (updatedMembership: Membership) => void
  maxFreezeDays?: number
}

function toDateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function FreezeModal({
  membership,
  isOpen,
  onClose,
  onSuccess,
  maxFreezeDays = 30,
}: FreezeModalProps) {
  const { t } = useTranslation()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const minDateStr = useMemo(() => {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return toDateString(tomorrow)
  }, [today])

  const maxDateStr = useMemo(() => {
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + maxFreezeDays - 1)
    return toDateString(maxDate)
  }, [today, maxFreezeDays])

  // Default freeze: 14 days or maxFreezeDays
  const defaultUntil = useMemo(() => {
    const target = new Date(today)
    target.setDate(target.getDate() + Math.min(14, maxFreezeDays) - 1)
    return toDateString(target)
  }, [today, maxFreezeDays])

  const [freezeUntil, setFreezeUntil] = useState<string>(defaultUntil)
  const [reason, setReason] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quickDaysOptions = useMemo(() => {
    return [7, 14, 30].filter((days) => days <= maxFreezeDays)
  }, [maxFreezeDays])

  const quickReasons = [
    t("memberships.freeze_reason_travel", "Nghỉ mát / Du lịch"),
    t("memberships.freeze_reason_work", "Công tác bận"),
    t("memberships.freeze_reason_medical", "Sức khỏe / Điều trị"),
    t("memberships.freeze_reason_personal", "Lý do cá nhân"),
  ]

  // Calculated duration in days
  const freezeDays = useMemo(() => {
    if (!freezeUntil) return 0
    const parts = freezeUntil.split("-").map(Number)
    const until = new Date(parts[0], parts[1] - 1, parts[2])
    const diffTime = until.getTime() - today.getTime()
    return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1)
  }, [freezeUntil, today])

  const projectedExpiry = useMemo(() => {
    if (!membership.expires_at || freezeDays <= 0) return null
    const base = new Date(membership.expires_at)
    base.setDate(base.getDate() + freezeDays)
    return toDateString(base)
  }, [membership.expires_at, freezeDays])

  const handleQuickDays = (days: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + days - 1)
    setFreezeUntil(toDateString(d))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!freezeUntil) {
      setError(t("memberships.freeze_err_date_required", "Vui lòng chọn ngày kết thúc bảo lưu"))
      return
    }

    if (freezeDays <= 1) {
      setError(t("memberships.freeze_err_future_date", "Ngày kết thúc bảo lưu phải sau hôm nay"))
      return
    }

    if (freezeDays > maxFreezeDays) {
      setError(
        t("memberships.freeze_err_exceeds_max", "Thời gian bảo lưu tối đa là {{max}} ngày", {
          max: maxFreezeDays,
        }),
      )
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await freezeMembership(membership.id, {
        freeze_until: freezeUntil,
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
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <PauseCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t("memberships.freeze_modal_title", "Bảo lưu thẻ hội viên")}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {membership.customer_name}
              </span>{" "}
              • {membership.phone} • {membership.package?.name}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Notice banner */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="space-y-1">
                <p className="font-medium">
                  {t(
                    "memberships.freeze_notice_title",
                    "Trong thời gian bảo lưu, hội viên không thể check-in.",
                  )}
                </p>
                {membership.expires_at && (
                  <p className="text-blue-700 dark:text-blue-400">
                    {t(
                      "memberships.freeze_notice_extension",
                      "Đối với gói theo ngày, ngày hết hạn sẽ được tự động cộng thêm số ngày bảo lưu thực tế khi mở khóa thẻ.",
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Freeze until input */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="freeze_until_input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                {t("memberships.freeze_until_label", "Bảo lưu đến hết ngày")}
              </label>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("memberships.freeze_days_count", "Thời lượng: {{days}} ngày", {
                  days: freezeDays,
                })}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                id="freeze_until_input"
                type="date"
                min={minDateStr}
                max={maxDateStr}
                value={freezeUntil}
                onChange={(e) => setFreezeUntil(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400"
              />
            </div>

            {/* Quick days selector */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1">
                {t("memberships.freeze_quick_select", "Chọn nhanh:")}
              </span>
              {quickDaysOptions.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleQuickDays(days)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                >
                  +{days} {t("common.days", "ngày")}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry extension preview */}
          {membership.expires_at && projectedExpiry && (
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{t("memberships.freeze_current_expiry", "Hạn hiện tại:")}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatDate(membership.expires_at)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span>{t("memberships.freeze_projected_expiry", "Dự kiến sau mở khóa:")}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatDate(projectedExpiry)}
                </span>
              </div>
            </div>
          )}

          {/* Reason input */}
          <div>
            <label
              htmlFor="freeze_reason_input"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              {t("memberships.freeze_reason_label", "Lý do bảo lưu (Tùy chọn)")}
            </label>
            <input
              id="freeze_reason_input"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                "memberships.freeze_reason_placeholder",
                "Ví dụ: Du lịch, việc gia đình, điều trị chấn thương...",
              )}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400"
            />
            {/* Quick reasons */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
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
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{t("memberships.freeze_confirm_btn", "Xác nhận bảo lưu")}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
