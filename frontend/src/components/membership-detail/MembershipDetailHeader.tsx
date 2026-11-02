import { ArrowRightLeft, Calendar, Package as PackageIcon, PauseCircle, QrCode } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { MembershipDetail } from "../../lib/memberships"
import { formatDate, remainingLabel } from "../../lib/formatters"
import { StatusBadge } from "../ui/StatusBadge"

interface MembershipDetailHeaderProps {
  detail: MembershipDetail
  onOpenCardTab?: () => void
}

export function MembershipDetailHeader({ detail, onOpenCardTab }: MembershipDetailHeaderProps) {
  const { t } = useTranslation()
  const isFrozen = detail.is_frozen || detail.status === "frozen"

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {detail.customer_name}
          </h3>
          <p className="mt-0.5 text-base font-medium text-slate-500 dark:text-slate-400">
            {detail.phone}
            {detail.email && <span className="ml-2 text-slate-400">· {detail.email}</span>}
          </p>
        </div>
        <StatusBadge status={detail.status} type="membership" />
      </div>

      {isFrozen && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
          <PauseCircle className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>
            {t("memberships.freeze_banner", {
              defaultValue: `Thẻ đang được bảo lưu đến ngày ${detail.frozen_until ? formatDate(detail.frozen_until) : "—"}`,
              date: detail.frozen_until ? formatDate(detail.frozen_until) : "—",
            })}
            {detail.freeze_reason ? ` (${detail.freeze_reason})` : ""}
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          <PackageIcon className="h-4 w-4 shrink-0" />
          <span>{detail.package.name}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
          <span>{remainingLabel(detail)}</span>
        </div>
        {onOpenCardTab && (
          <button
            type="button"
            onClick={onOpenCardTab}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
          >
            <QrCode className="h-4 w-4 shrink-0" />
            <span>Thẻ QR</span>
          </button>
        )}
      </div>

      {detail.is_transferred && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/80 px-3.5 py-2 text-xs font-medium text-purple-800 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-300">
          <ArrowRightLeft className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
          <span>
            {t(
              "member_detail.transferred_to_notice",
              "Thẻ đã được chuyển nhượng cho: {{name}}",
              { name: detail.transferred_to_name || "Hội viên khác" },
            )}
          </span>
        </div>
      )}
      {detail.transferred_from_name && !detail.is_transferred && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-xs font-medium text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300">
          <ArrowRightLeft className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>
            {t(
              "member_detail.transferred_from_notice",
              "Nhận chuyển nhượng từ: {{name}}",
              { name: detail.transferred_from_name },
            )}
          </span>
        </div>
      )}
    </div>
  )
}
