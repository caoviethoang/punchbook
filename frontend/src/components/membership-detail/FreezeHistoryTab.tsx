import { PauseCircle, PlayCircle, Snowflake } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { FreezeHistoryItem } from "../../lib/memberships"
import { formatDate } from "../../lib/formatters"

interface FreezeHistoryTabProps {
  freezeHistory?: FreezeHistoryItem[]
}

export function FreezeHistoryTab({ freezeHistory = [] }: FreezeHistoryTabProps) {
  const { t } = useTranslation()

  if (freezeHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
        <Snowflake className="mb-3 h-10 w-10 stroke-1 text-slate-400" />
        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
          {t("member_detail.empty_freeze_history", "Chưa có lịch sử bảo lưu")}
        </p>
        <p className="mt-1 text-sm">
          {t(
            "member_detail.empty_freeze_history_desc",
            "Hội viên này chưa từng thực hiện bảo lưu hoặc mở khóa thẻ.",
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">{t("member_detail.col_freeze_action", "Thao tác")}</th>
            <th className="px-4 py-3">{t("member_detail.col_freeze_time", "Thời gian")}</th>
            <th className="px-4 py-3">{t("member_detail.col_freeze_staff", "Nhân viên")}</th>
            <th className="px-4 py-3">{t("member_detail.col_freeze_details", "Chi tiết & Lý do")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {freezeHistory.map((item) => {
            const isFrozen = item.action === "membership_frozen"

            return (
              <tr
                key={item.id}
                className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-3">
                  {isFrozen ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      <PauseCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{t("memberships.action_frozen", "Bảo lưu")}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <PlayCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{t("memberships.action_unfrozen", "Mở khóa")}</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {formatDate(item.created_at)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                  {item.staff_name || "—"}
                </td>
                <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                  <div className="space-y-0.5">
                    {isFrozen && item.details?.frozen_until && (
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {t("memberships.freeze_until_label", "Bảo lưu đến:")}{" "}
                        </span>
                        {formatDate(item.details.frozen_until)}
                        {item.details?.freeze_days ? ` (${item.details.freeze_days} ngày)` : ""}
                      </p>
                    )}
                    {!isFrozen && item.details?.days_extended !== undefined && (
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {t("memberships.days_extended_label", "Gia hạn thêm:")}{" "}
                        </span>
                        +{item.details.days_extended} {t("common.days", "ngày")}
                        {item.details.new_expires_at && (
                          <span className="text-slate-500 dark:text-slate-400">
                            {" "}
                            → {formatDate(item.details.new_expires_at)}
                          </span>
                        )}
                      </p>
                    )}
                    {item.details?.reason && (
                      <p className="italic text-slate-500 dark:text-slate-400">
                        "{item.details.reason}"
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
