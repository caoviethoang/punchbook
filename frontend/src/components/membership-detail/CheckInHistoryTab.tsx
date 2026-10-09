import { Clock, History, Printer, User } from "lucide-react"
import type { MembershipDetail } from "../../lib/memberships"
import { formatDateTime } from "../../lib/formatters"

interface CheckInHistoryTabProps {
  checkIns: MembershipDetail["check_ins"]
  onPrintReceipt: (checkedInAt: string, staffName?: string | null) => void
}

export function CheckInHistoryTab({ checkIns, onPrintReceipt }: CheckInHistoryTabProps) {
  if (checkIns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
        <History className="mb-3 h-10 w-10 stroke-1" />
        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
          Chưa có lịch sử Check-in
        </p>
        <p className="mt-1 text-sm">
          Hội viên này chưa thực hiện lượt check-in nào.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">Thời gian Check-in</th>
            <th className="px-4 py-3">Nhân viên thực hiện</th>
            <th className="px-4 py-3 text-right">In phiếu</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {checkIns.map((item) => (
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
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onPrintReceipt(item.checked_in_at, item.staff?.name)}
                  title="In phiếu check-in"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Printer className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  In phiếu
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
