import { useState, useRef, type DragEvent, type ChangeEvent } from "react"
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  FileCheck,
} from "lucide-react"
import {
  downloadMembershipImportTemplate,
  importMemberships,
  type ImportMembershipsResult,
} from "../lib/memberships"

interface ImportMembershipsModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function ImportMembershipsModal({
  onClose,
  onSuccess,
}: ImportMembershipsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [importing, setImporting] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportMembershipsResult | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true)
      setGeneralError(null)
      await downloadMembershipImportTemplate()
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : "Tải file mẫu thất bại."
      )
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setGeneralError(null)
      setResult(null)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      const ext = droppedFile.name.toLowerCase()
      if (
        ext.endsWith(".xlsx") ||
        ext.endsWith(".xls") ||
        ext.endsWith(".csv")
      ) {
        setFile(droppedFile)
        setGeneralError(null)
        setResult(null)
      } else {
        setGeneralError("Chỉ chấp nhận file định dạng .xlsx, .xls hoặc .csv.")
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setGeneralError("Vui lòng chọn file trước khi import.")
      return
    }

    try {
      setImporting(true)
      setGeneralError(null)
      const res = await importMemberships(file)
      setResult(res)
      if (res.success_count > 0 && onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : "Import danh sách thất bại."
      )
    } finally {
      setImporting(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setResult(null)
    setGeneralError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Import danh sách Hội viên
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thêm nhiều hội viên từ file Excel (.xlsx, .xls) hoặc CSV (.csv)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Step 1: Download Template */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                  Chưa có file mẫu?
                </p>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80">
                  Tải file mẫu Excel chuẩn có sẵn tên các gói dịch vụ của shop.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleDownloadTemplate()}
                disabled={downloadingTemplate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {downloadingTemplate ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>
                  {downloadingTemplate ? "Đang tải..." : "Tải file mẫu Excel"}
                </span>
              </button>
            </div>
          </div>

          {generalError && (
            <div className="rounded-xl bg-rose-50 p-3.5 text-sm font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{generalError}</span>
              </div>
            </div>
          )}

          {/* If no result yet: File Picker / Dropzone */}
          {!result ? (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/30"
                    : file
                      ? "border-emerald-500/50 bg-emerald-50/20 dark:border-emerald-800 dark:bg-emerald-950/10"
                      : "border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600"
                }`}
              >
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB · Nhấp để đổi file
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Kéo thả file vào đây hoặc nhấp để chọn file
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Hỗ trợ định dạng .xlsx, .xls, .csv (Tối đa 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Result Section */
            <div className="space-y-4">
              {/* Status Header Banner */}
              <div
                className={`rounded-xl p-4 ${
                  result.error_count === 0
                    ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : result.success_count > 0
                      ? "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                      : "bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.error_count === 0 ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : result.success_count > 0 ? (
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">
                      {result.error_count === 0
                        ? `Nhập thành công toàn bộ ${result.success_count} hội viên!`
                        : result.success_count > 0
                          ? `Đã nhập thành công ${result.success_count} hội viên. Có ${result.error_count} dòng bị lỗi.`
                          : `Import thất bại: Cả ${result.error_count} dòng đều không hợp lệ.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tổng số dòng
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {result.total_rows}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Thành công
                  </p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {result.success_count}
                  </p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
                  <p className="text-xs text-rose-700 dark:text-rose-400">
                    Lỗi
                  </p>
                  <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
                    {result.error_count}
                  </p>
                </div>
              </div>

              {/* Error Detail Table */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Chi tiết các dòng bị lỗi ({result.errors.length})
                  </h4>
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <table className="min-w-full text-left text-xs">
                      <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Dòng</th>
                          <th className="px-3 py-2 font-semibold">Hội viên</th>
                          <th className="px-3 py-2 font-semibold">SĐT</th>
                          <th className="px-3 py-2 font-semibold">Gói</th>
                          <th className="px-3 py-2 font-semibold">Nguyên nhân lỗi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {result.errors.map((err, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20"
                          >
                            <td className="px-3 py-2 font-medium text-slate-600 dark:text-slate-400">
                              #{err.row}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                              {err.customer_name || "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                              {err.phone || "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                              {err.package_name || "—"}
                            </td>
                            <td className="px-3 py-2 font-medium text-rose-600 dark:text-rose-400">
                              {err.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          {result ? (
            <>
              <button
                type="button"
                onClick={resetUpload}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Import file khác
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Hoàn tất
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={!file || importing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Bắt đầu Import</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
