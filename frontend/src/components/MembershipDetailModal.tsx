import { useEffect, useState } from "react"
import {
  AlertCircle,
  Calendar,
  Clock,
  CreditCard,
  History,
  Loader2,
  Package as PackageIcon,
  Receipt,
  User,
  UserCheck,
} from "lucide-react"
import {
  getMembershipDetail,
  type MembershipDetail,
} from "../lib/memberships"
import { formatDate, formatDateTime, formatVnd, remainingLabel } from "../lib/formatters"
import { Modal } from "./ui/Modal"
import { StatusBadge } from "./ui/StatusBadge"

interface MembershipDetailModalProps {
  membershipId: string
  onClose: () => void
}

type TabType = "check_ins" | "invoices"

export function MembershipDetailModal({
  membershipId,
  onClose,
}: MembershipDetailModalProps) {
  const [detail, setDetail] = useState<MembershipDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("check_ins")

  useEffect(() => {
    let isCancelled = false

    getMembershipDetail(membershipId)
      .then((data) => {
        if (!isCancelled) {
          setDetail(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải thông tin chi tiết hội viên.",
          )
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [membershipId])

  return (
    <Modal isOpen={true} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="flex max-h-[90vh] flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="border-b border-slate-100 p-6 dark:border-slate-800 sm:p-7">
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span className="text-base font-medium text-slate-600 dark:text-slate-400">
                Đang tải thông tin chi tiết hội viên...
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          ) : detail ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {detail.customer_name}
                  </h3>
                  <p className="mt-0.5 text-base font-medium text-slate-500 dark:text-slate-400">
                    {detail.phone}
                  </p>
                </div>
                <StatusBadge status={detail.status} type="membership" />
              </div>

              {/* Package & Remaining Info */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  <PackageIcon className="h-4 w-4 shrink-0" />
                  <span>{detail.package.name}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>{remainingLabel(detail)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Body with Tabs */}
        {!loading && !error && detail && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Tab Controls */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 dark:border-slate-800 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => setActiveTab("check_ins")}
                className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-sm font-semibold transition ${
                  activeTab === "check_ins"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Lịch sử Check-in</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {detail.check_ins.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("invoices")}
                className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-sm font-semibold transition ${
                  activeTab === "invoices"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Receipt className="h-4 w-4" />
                <span>Lịch sử Thanh toán</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {detail.invoices.length}
                </span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "check_ins" ? (
                detail.check_ins.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
                    <History className="mb-3 h-10 w-10 stroke-1" />
                    <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                      Chưa có lịch sử Check-in
                    </p>
                    <p className="mt-1 text-sm">
                      Hội viên này chưa thực hiện lượt check-in nào.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Thời gian Check-in</th>
                          <th className="px-4 py-3">Nhân viên thực hiện</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {detail.check_ins.map((item) => (
                          <tr
                            key={item.id}
                            className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-500" />
                                <span>{formatDateTime(item.checked_in_at)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-slate-400" />
                                <span>{item.staff?.name ?? "Nhân viên"}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : detail.invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
                  <CreditCard className="mb-3 h-10 w-10 stroke-1" />
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    Chưa có lịch sử Thanh toán
                  </p>
                  <p className="mt-1 text-sm">
                    Hội viên này chưa có hóa đơn giao hạn hoặc tạo mới nào.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Mã hóa đơn</th>
                        <th className="px-4 py-3">Ngày tạo</th>
                        <th className="px-4 py-3">Số tiền</th>
                        <th className="px-4 py-3">PayOS / Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {detail.invoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                            #{inv.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {formatDate(inv.created_at)}
                          </td>
                          <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-slate-100">
                            {formatVnd(inv.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <div>
                                <StatusBadge status={inv.status} type="invoice" />
                              </div>
                              {inv.payos_transaction_id && (
                                <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                                  Tx: {inv.payos_transaction_id}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
