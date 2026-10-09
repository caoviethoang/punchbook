
import { AlertTriangle, Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { useImportMembers } from "../hooks/useImportMembers"
import { FileDropzone } from "./import/FileDropzone"
import { ImportResultTable } from "./import/ImportResultTable"
import { Modal } from "./ui/Modal"

interface ImportMembersModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ImportMembersModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportMembersModalProps) {
  const {
    selectedFile,
    isDownloadingTemplate,
    isUploading,
    generalError,
    importResult,
    handleDownloadTemplate,
    handleFileSelect,
    handleImportSubmit,
    handleReset,
  } = useImportMembers(onSuccess)

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidthClass="max-w-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Import danh sách hội viên
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nhập danh sách hội viên & gói dịch vụ từ file Excel hoặc CSV
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {generalError && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{generalError}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Chưa có file mẫu?
            </p>
            <p>Tải file Excel mẫu chuẩn format để chuẩn bị dữ liệu hội viên.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleDownloadTemplate()}
            disabled={isDownloadingTemplate}
            className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {isDownloadingTemplate ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>Tải file mẫu (.xlsx)</span>
          </button>
        </div>

        {!importResult ? (
          <form onSubmit={(e) => void handleImportSubmit(e)} className="space-y-4">
            <FileDropzone
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onReset={handleReset}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang import...
                  </>
                ) : (
                  "Import dữ liệu"
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <ImportResultTable importResult={importResult} />
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Import file khác
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
