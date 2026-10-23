import { AlertCircle, CheckCircle2, Printer, Users } from "lucide-react"
import type { BatchCheckInResult, Membership } from "../../lib/memberships"
import { Modal } from "../ui/Modal"

interface GroupCheckInResultModalProps {
  isOpen: boolean
  result: BatchCheckInResult | null
  onClose: () => void
  onPrintReceipt: (membership: Membership, checkedInAt?: string) => void
}

export function GroupCheckInResultModal({
  isOpen,
  result,
  onClose,
  onPrintReceipt,
}: GroupCheckInResultModalProps) {
  if (!result) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Kết quả điểm danh nhóm
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tổng hợp lượt điểm danh lớp học nhóm
              </p>
            </div>
          </div>

          {/* Summary Badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Tổng số: {result.total}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {result.success_count} thành công
            </span>
            {result.failed_count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-300">
                <AlertCircle className="h-3.5 w-3.5" />
                {result.failed_count} thất bại
              </span>
            )}
          </div>
        </div>

        {/* Member Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 sm:p-5">
          {result.results.map((item) => {
            const isSuccess = item.status === "success"

            return (
              <div
                key={item.membership_id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                  isSuccess
                    ? "border-emerald-100 bg-emerald-50/40 dark:border-emerald-950/50 dark:bg-emerald-950/20"
                    : "border-red-100 bg-red-50/40 dark:border-red-950/50 dark:bg-red-950/20"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isSuccess
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-400"
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.customer_name}
                    </p>
                    <p
                      className={`text-xs ${
                        isSuccess
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isSuccess
                        ? item.membership?.sessions_left !== null &&
                          item.membership?.sessions_left !== undefined
                          ? `Check-in thành công (Còn lại ${item.membership.sessions_left} buổi)`
                          : "Check-in thành công"
                        : item.error || "Điểm danh không thành công"}
                    </p>
                  </div>
                </div>

                {/* Print Receipt button for successful check-ins */}
                {isSuccess && item.membership && (
                  <button
                    type="button"
                    onClick={() => onPrintReceipt(item.membership!, item.check_in?.checked_in_at)}
                    title={`In phiếu check-in cho ${item.customer_name}`}
                    aria-label={`In phiếu cho ${item.customer_name}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Printer className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden sm:inline">In phiếu</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800 sm:p-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white sm:text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  )
}
