import { AlertTriangle, Loader2 } from "lucide-react"
import type { Membership } from "../../lib/memberships"

interface DeleteMemberModalProps {
  deletingMember: Membership
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteMemberModal({
  deletingMember,
  deleting,
  onCancel,
  onConfirm,
}: DeleteMemberModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/60">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold">Xác nhận xóa hội viên</h3>
        </div>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Bạn có chắc chắn muốn xóa hội viên{" "}
          <strong className="font-bold text-slate-900 dark:text-slate-50">
            {deletingMember.customer_name}
          </strong>{" "}
          ({deletingMember.phone})?
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Xóa hội viên</span>
          </button>
        </div>
      </div>
    </div>
  )
}
