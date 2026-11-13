import { useState } from "react"
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  HeartHandshake,
  Loader2,
  PauseCircle,
  PlayCircle,
  QrCode,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { sendMemberReengagement } from "../../lib/churnRisk"
import type { Membership, PaginationMeta, StatusFilterType } from "../../lib/memberships"
import { computeMembershipStatus, getPaginationRange } from "../../lib/memberships"
import { StatusBadge } from "../ui/StatusBadge"
import { MemberRemainingBadge } from "./MemberRemainingBadge"

interface MembershipTableProps {
  loading: boolean
  error: string | null
  memberships: Membership[]
  meta: PaginationMeta | null
  page: number
  debouncedQuery: string
  status: StatusFilterType
  onReload: () => void
  onPageChange: (p: number) => void
  onOpenQR: (m: Membership) => void
  onOpenDetail: (id: string) => void
  onOpenEdit: (m: Membership) => void
  onOpenDelete: (m: Membership) => void
  onOpenFreeze?: (m: Membership) => void
  onOpenUnfreeze?: (m: Membership) => void
  onOpenTransfer?: (m: Membership) => void
  onRestore?: (m: Membership) => void
  restoringId?: string | null
}

export function MembershipTable({
  loading,
  error,
  memberships,
  meta,
  page,
  debouncedQuery,
  status,
  onReload,
  onPageChange,
  onOpenQR,
  onOpenDetail,
  onOpenEdit,
  onOpenDelete,
  onOpenFreeze,
  onOpenUnfreeze,
  onOpenTransfer,
  onRestore,
  restoringId,
}: MembershipTableProps) {
  const { t } = useTranslation()
  const [sendingReengagementId, setSendingReengagementId] = useState<string | null>(null)
  const [sentReengagementIds, setSentReengagementIds] = useState<Record<string, boolean>>({})

  const handleSendReengagement = async (member: Membership) => {
    setSendingReengagementId(member.id)
    try {
      await sendMemberReengagement(member.id)
      setSentReengagementIds((prev) => ({ ...prev, [member.id]: true }))
    } finally {
      setSendingReengagementId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
        <p className="font-semibold">{error}</p>
        <button
          type="button"
          onClick={onReload}
          className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-200 dark:bg-red-900/60 dark:text-red-200"
        >
          {t("common.retry", "Thử lại")}
        </button>
      </div>
    )
  }

  if (memberships.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        {status === "deleted"
          ? t("memberships.empty_deleted", "Không có hội viên nào đã bị xóa.")
          : debouncedQuery || status !== "all"
            ? t("memberships.empty_filter", "Không tìm thấy hội viên khớp với bộ lọc.")
            : t("memberships.empty_state", "Chưa có hội viên nào trong cửa hàng.")}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3.5 font-semibold">{t("memberships.col_name", "Tên hội viên")}</th>
              <th className="px-4 py-3.5 font-semibold">{t("memberships.col_package", "Gói đăng ký")}</th>
              <th className="px-4 py-3.5 font-semibold">{t("memberships.col_remaining", "Thời hạn / Số buổi")}</th>
              <th className="px-4 py-3.5 font-semibold">{t("memberships.col_status", "Trạng thái")}</th>
              <th className="px-4 py-3.5 font-semibold text-right">{t("memberships.col_actions", "Thao tác")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {memberships.map((m) => (
              <tr key={m.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3.5">
                  <div className="flex min-w-max items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenQR(m)}
                      title="Xem mã QR Check-in"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <div className="shrink-0 whitespace-nowrap text-left">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(m.id)}
                        className="block text-left font-semibold text-slate-900 transition hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                      >
                        {m.customer_name}
                      </button>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{m.phone}</p>
                      {m.email && (
                        <p className="max-w-[160px] truncate text-[11px] text-slate-400 dark:text-slate-500">{m.email}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                  <div>{m.package?.name || t("memberships.unknown_package", "Không rõ")}</div>
                  {m.assigned_staff && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      PT: {m.assigned_staff.name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <MemberRemainingBadge membership={m} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={m.status ?? computeMembershipStatus(m)} type="membership" className="whitespace-nowrap" />
                    {m.churn_risk_level && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          m.churn_risk_level === "high"
                            ? "bg-red-500/15 text-red-600 dark:text-red-400"
                            : m.churn_risk_level === "medium"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                        }`}
                      >
                        {t(`churn_risk.level_${m.churn_risk_level}`)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="w-px whitespace-nowrap px-4 py-3.5 text-right">
                  <div className="flex min-w-max items-center justify-end gap-1.5 [&>button]:h-8 [&>button]:shrink-0 [&>button]:whitespace-nowrap [&_svg]:shrink-0">
                    {status === "deleted" || m.status === "deleted" ? (
                      <button
                        type="button"
                        onClick={() => onRestore?.(m)}
                        disabled={restoringId === m.id}
                        title="Khôi phục hội viên"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                      >
                        {restoringId === m.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        <span>{t("memberships.restore", "Khôi phục")}</span>
                      </button>
                    ) : (
                      <>
                        {(m.churn_risk_level || status === "at_risk") && (
                          <button
                            type="button"
                            onClick={() => handleSendReengagement(m)}
                            disabled={sendingReengagementId === m.id}
                            title={t("churn_risk.send_we_miss_you", "Nhắc quay lại")}
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                              sentReengagementIds[m.id] || m.last_reengagement_sent_at
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            {sendingReengagementId === m.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : sentReengagementIds[m.id] || m.last_reengagement_sent_at ? (
                              <HeartHandshake className="h-3.5 w-3.5" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">
                              {sentReengagementIds[m.id] || m.last_reengagement_sent_at
                                ? t("churn_risk.sent_again", "Đã nhắc")
                                : t("churn_risk.send_we_miss_you", "Nhắc quay lại")}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenDetail(m.id)}
                          title={t("common.details", "Chi tiết & Lịch sử")}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="hidden sm:inline">{t("common.details", "Chi tiết")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenEdit(m)}
                          title={t("common.renew", "Gia hạn / Chỉnh sửa")}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span className="hidden sm:inline">{t("common.renew", "Gia hạn")}</span>
                        </button>

                        {m.is_frozen || m.status === "frozen" ? (
                          <button
                            type="button"
                            onClick={() => onOpenUnfreeze?.(m)}
                            title={t("memberships.unfreeze", "Mở khóa bảo lưu")}
                            className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                          >
                            <PlayCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="hidden sm:inline">{t("memberships.unfreeze", "Mở khóa")}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenFreeze?.(m)}
                            disabled={m.status === "expired" || m.status === "transferred" || m.is_transferred}
                            title={t("memberships.freeze", "Bảo lưu thẻ")}
                            className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                          >
                            <PauseCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="hidden sm:inline">{t("memberships.freeze", "Bảo lưu")}</span>
                          </button>
                        )}

                        {onOpenTransfer && (
                          <button
                            type="button"
                            onClick={() => onOpenTransfer(m)}
                            disabled={m.status === "transferred" || m.is_transferred}
                            title={
                              m.status === "transferred" || m.is_transferred
                                ? t("memberships.already_transferred", "Đã chuyển nhượng")
                                : t("memberships.transfer_action", "Chuyển nhượng thẻ")
                            }
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                            <span className="hidden sm:inline">{t("memberships.transfer_btn_short", "Chuyển")}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenEdit(m)}
                          title="Sửa thông tin"
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenDelete(m)}
                          title="Xóa hội viên"
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.total_pages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 py-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Hiển thị trang {meta.page} / {meta.total_pages} (Tổng {meta.total} hội viên)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Trang trước</span>
            </button>

            <div className="flex items-center gap-1">
              {getPaginationRange(meta.page, meta.total_pages).map((item, idx) =>
                item === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-xs text-slate-400 select-none"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    disabled={loading}
                    onClick={() => onPageChange(item)}
                    aria-label={`Trang ${item}`}
                    aria-current={item === page ? "page" : undefined}
                    className={`min-w-[32px] rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                      item === page
                        ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              disabled={page >= meta.total_pages || loading}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Trang sau"
            >
              <span className="hidden sm:inline">Trang sau</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
