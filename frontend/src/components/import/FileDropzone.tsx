import React, { useState } from "react"
import { FileText, Upload } from "lucide-react"

interface FileDropzoneProps {
  selectedFile: File | null
  onFileSelect: (file: File | null) => void
  onReset: () => void
}

export function FileDropzone({ selectedFile, onFileSelect, onReset }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)

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
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  return (
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
            onClick={onReset}
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
                onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
              />
            </label>
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Hỗ trợ định dạng: .xlsx, .xls, .csv
          </p>
        </>
      )}
    </div>
  )
}
