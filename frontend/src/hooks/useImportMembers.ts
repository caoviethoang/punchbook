import { useState } from "react"
import { downloadImportTemplate, importMemberships, type ImportMembershipsResult } from "../lib/memberships"

export function useImportMembers(onSuccessCallback?: () => void) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportMembershipsResult | null>(null)

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true)
      setGeneralError(null)
      await downloadImportTemplate()
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : "Không thể tải file mẫu."
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

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    try {
      setIsUploading(true)
      setGeneralError(null)
      const result = await importMemberships(selectedFile)
      setImportResult(result)
      if (result.success_count > 0 && onSuccessCallback) {
        onSuccessCallback()
      }
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : "Import dữ liệu thất bại."
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

  return {
    selectedFile,
    isDownloadingTemplate,
    isUploading,
    generalError,
    importResult,
    handleDownloadTemplate,
    handleFileSelect,
    handleImportSubmit,
    handleReset,
  }
}
