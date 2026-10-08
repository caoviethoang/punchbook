import { CreditCard } from "lucide-react"
import type { MembershipDetail } from "../../lib/memberships"
import { formatDate, formatVnd } from "../../lib/formatters"
import { StatusBadge } from "../ui/StatusBadge"

interface InvoiceHistoryTabProps {
  invoices: MembershipDetail["invoices"]
}

export function InvoiceHistoryTab({ invoices }: InvoiceHistoryTabProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
        <CreditCard className="mb-3 h-10 w-10 stroke-1" />
        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
          Chưa có lịch sử Thanh toán
        </p>
        <p className="mt-1 text-sm">
          Hội viên này chưa có hóa đơn giao hạn hoặc tạo mới nào.
        </p>
      </div>
    )
  }

  return (
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
          {invoices.map((inv) => (
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
  )
}
