import { Loader2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { PackageItem } from "../../lib/packages"
import { Modal } from "../ui/Modal"

interface DeletePackageModalProps {
  packageItem: PackageItem | null
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeletePackageModal({
  packageItem,
  loading,
  onClose,
  onConfirm,
}: DeletePackageModalProps) {
  const { t } = useTranslation()

  return (
    <Modal isOpen={packageItem !== null} onClose={onClose} maxWidthClass="max-w-md">
      {packageItem && (
        <div className="p-6">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              {t("packages.delete_modal_title", "Xác nhận xóa gói")}
            </h3>
          </div>

          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            {t(
              "packages.delete_modal_confirm",
              `Bạn có chắc chắn muốn xóa gói dịch vụ "${packageItem.name}" không? Các hội viên đang sử dụng gói này sẽ không bị ảnh hưởng.`,
              { name: packageItem.name },
            )}
          </p>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t("common.cancel", "Hủy")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("packages.deleting_btn", "Đang xóa...")}
                </>
              ) : (
                t("packages.delete_btn", "Xóa gói")
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
