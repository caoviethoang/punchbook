import { ArrowRightLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { TransferRecord } from "../../lib/memberships"
import { formatDate, formatVnd } from "../../lib/formatters"

interface TransferHistoryTabProps {
  transfers?: TransferRecord[]
  currentMembershipId?: string
}

export function TransferHistoryTab({
  transfers = [],
  currentMembershipId,
}: TransferHistoryTabProps) {
  const { t } = useTranslation()

  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
        <ArrowRightLeft className="mb-3 h-10 w-10 stroke-1" />
        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
          {t("member_detail.empty_transfers", "Chưa có lịch sử chuyển nhượng")}
        </p>
        <p className="mt-1 text-sm">
          {t(
            "member_detail.empty_transfers_desc",
            "Hội viên này chưa thực hiện hoặc nhận chuyển nhượng thẻ tập nào.",
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
            <th className="px-4 py-3">{t("member_detail.col_transfer_date", "Thời gian")}</th>
            <th className="px-4 py-3">{t("member_detail.col_transfer_type", "Loại giao dịch")}</th>
            <th className="px-4 py-3">{t("member_detail.col_transfer_party", "Đối tác")}</th>
            <th className="px-4 py-3">{t("member_detail.col_transfer_balance", "Chuyển giao")}</th>
            <th className="px-4 py-3">{t("member_detail.col_transfer_fee", "Phí chuyển")}</th>
            <th className="px-4 py-3">{t("member_detail.col_transfer_staff", "Nhân viên")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {transfers.map((item) => {
            const isOutgoing =
              !currentMembershipId || item.source_membership_id === currentMembershipId
            const partyName = isOutgoing
              ? item.target_customer_name || "Hội viên nhận"
              : item.source_customer_name || "Hội viên chuyển"
            const partyPhone = isOutgoing ? item.target_phone : item.source_phone

            const balanceText =
              item.sessions_transferred !== null && item.sessions_transferred !== undefined
                ? `${item.sessions_transferred} ${t("common.sessions", "buổi")}`
                : item.days_transferred !== null && item.days_transferred !== undefined
                  ? `${item.days_transferred} ${t("common.days", "ngày")}`
                  : "0"

            return (
              <tr
                key={item.id}
                className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {formatDate(item.created_at)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isOutgoing
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    }`}
                  >
                    {isOutgoing
                      ? t("member_detail.transfer_outgoing", "Chuyển đi")
                      : t("member_detail.transfer_incoming", "Nhận vào")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {partyName}
                  </div>
                  {partyPhone && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">{partyPhone}</div>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                  {balanceText}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  {item.fee > 0 ? formatVnd(item.fee) : t("common.free", "Miễn phí")}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                  {item.staff_name || "Hệ thống"}
                  {item.note && (
                    <div className="mt-0.5 max-w-xs truncate text-[11px] text-slate-400" title={item.note}>
                      {item.note}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
