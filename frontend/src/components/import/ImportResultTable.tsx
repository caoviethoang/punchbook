import { CheckCircle2 } from "lucide-react"
import type { ImportMembershipsResult } from "../../lib/memberships"

interface ImportResultTableProps {
  importResult: ImportMembershipsResult
}

export function ImportResultTable({ importResult }: ImportResultTableProps) {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-950/60">
          <span className="text-xs text-slate-500 dark:text-slate-400">Tổng dòng</span>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {importResult.total_rows}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
          <span className="text-xs text-emerald-700 dark:text-emerald-400">Thành công</span>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
            {importResult.success_count}
          </p>
        </div>
        <div className="rounded-xl bg-rose-50 p-3 text-center dark:bg-rose-950/30">
          <span className="text-xs text-rose-700 dark:text-rose-400">Bị lỗi</span>
          <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
            {importResult.failed_count}
          </p>
        </div>
      </div>

      {importResult.failed_count === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Tất cả dữ liệu hội viên đã được import thành công!</span>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Chi tiết dòng bị lỗi ({importResult.failed_count})
          </h4>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2">Dòng</th>
                  <th className="px-3 py-2">Hội viên</th>
                  <th className="px-3 py-2">SĐT</th>
                  <th className="px-3 py-2">Lỗi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {importResult.errors.map((err, idx) => (
                  <tr key={idx} className="bg-white dark:bg-slate-900">
                    <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">
                      {err.row > 0 ? `Dòng ${err.row}` : "-"}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                      {err.customer_name}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      {err.phone}
                    </td>
                    <td className="px-3 py-2 text-rose-600 dark:text-rose-400">
                      {err.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
