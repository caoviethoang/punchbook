import { FileSpreadsheet, Loader2, Shield, Upload } from "lucide-react"

interface DashboardHeaderProps {
  isAdmin: boolean
  exporting: boolean
  onOpenAuditLogs: () => void
  onOpenImportModal: () => void
  onExport: () => void
}

export function DashboardHeader({
  isAdmin,
  exporting,
  onOpenAuditLogs,
  onOpenImportModal,
  onExport,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Dashboard
        </h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
          Tình hình shop trong tháng này
        </p>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAuditLogs}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Nhật ký</span>
          </button>

          <button
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>{exporting ? "Đang xuất..." : "Xuất Excel"}</span>
          </button>
        </div>
      )}
    </div>
  )
}
