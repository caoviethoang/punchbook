import React, { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react"
import {
  downloadImportTemplate,
  importMemberships,
  type ImportMembershipsResult,
} from "../lib/memberships"

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportMembershipsResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  if (!isOpen) return null

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true)
      setGeneralError(null)
      await downloadImportTemplate()
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : "Không thể tải file mẫu.",
      )
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  const handleFileSelect = (file: File | null) => {
    if (!file) return
    const validExtensions = [".xlsx", ".xls", ".csv"]
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    if (!validExtensions.includes(ext)) {
      setGeneralError("Vui lòng chọn file đúng định dạng .xlsx, .xls hoặc .csv")
      return
    }
    setGeneralError(null)
    setSelectedFile(file)
    setImportResult(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    try {
      setIsUploading(true)
      setGeneralError(null)
      const result = await importMemberships(selectedFile)
      setImportResult(result)
      if (result.success_count > 0) {
        onSuccess()
      }
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : "Import dữ liệu thất bại.",
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setImportResult(null)
    setGeneralError(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Header */}
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
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-5 p-6">
          {generalError && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Instructions & Template Download */}
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
              {/* File Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : selectedFile
                      ? "border-emerald-300 bg-emerald-50/20 dark:border-emerald-900 dark:bg-emerald-950/10"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700"
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      <FileText className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-2 text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
                    >
                      Chọn file khác
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Kéo thả file vào đây hoặc{" "}
                      <label className="cursor-pointer text-emerald-600 hover:underline dark:text-emerald-400">
                        tải lên file từ máy tính
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                        />
                      </label>
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Hỗ trợ định dạng: .xlsx, .xls, .csv
                    </p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
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
            /* Result Summary View */
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

              {/* Reset / Done Action */}
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
      </div>
    </div>
  )
}
