import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, Camera, Keyboard, QrCode, Upload, X } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (scannedText: string) => void
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: QRScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual">("camera")
  const [manualInput, setManualInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [cameraPermissionError, setCameraPermissionError] = useState(false)
  const scannerContainerId = "qr-reader-container"
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const onScanSuccessRef = useRef(onScanSuccess)

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess
  }, [onScanSuccess])

  const stopCameraScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop()
        }
        html5QrCodeRef.current.clear()
      } catch (e) {
        console.warn("Error stopping QR scanner:", e)
      } finally {
        html5QrCodeRef.current = null
      }
    }
  }, [])

  // Start camera when camera tab is selected & modal is open
  useEffect(() => {
    if (!isOpen || activeTab !== "camera") {
      void stopCameraScanner()
      return
    }

    let isSubscribed = true

    const startScanner = async () => {
      setCameraPermissionError(false)
      setError(null)

      try {
        await stopCameraScanner()

        if (!isSubscribed) return

        const qrScanner = new Html5Qrcode(scannerContainerId)
        html5QrCodeRef.current = qrScanner

        await qrScanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (isSubscribed) {
              void stopCameraScanner()
              onScanSuccessRef.current(decodedText)
            }
          },
          () => {
            // Ignore scan attempt errors (continuous scanning)
          },
        )
      } catch (err) {
        if (!isSubscribed) return
        console.error("Camera scanner error:", err)
        setCameraPermissionError(true)
        setError(
          "Không thể truy cập camera. Vui lòng cho phép quyền sử dụng camera hoặc dùng tính năng Tải ảnh/Nhập mã.",
        )
      }
    }

    const timer = setTimeout(() => {
      void startScanner()
    }, 150)

    return () => {
      isSubscribed = false
      clearTimeout(timer)
      void stopCameraScanner()
    }
  }, [isOpen, activeTab, stopCameraScanner])

  const handleClose = () => {
    void stopCameraScanner()
    onClose()
  }

  // Handle image file upload decoding
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    try {
      const html5QrCode = new Html5Qrcode("qr-file-temp")
      const decodedText = await html5QrCode.scanFile(file, true)
      html5QrCode.clear()
      onScanSuccess(decodedText)
    } catch (err) {
      console.error("File QR scan error:", err)
      setError("Không tìm thấy mã QR hợp lệ trong hình ảnh đã chọn.")
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = manualInput.trim()
    if (!trimmed) {
      setError("Vui lòng nhập mã QR hoặc ID hội viên.")
      return
    }
    onScanSuccess(trimmed)
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Quét mã QR Hội viên
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quét qua camera, chọn tệp ảnh hoặc nhập mã
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-3 dark:border-slate-800 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === "camera"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === "upload"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Tải ảnh QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === "manual"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Keyboard className="h-4 w-4" />
            <span>Nhập mã</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === "camera" && (
            <div className="flex flex-col items-center">
              <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl border-2 border-indigo-200 bg-slate-950 dark:border-indigo-900">
                <div id={scannerContainerId} className="h-full w-full" />
                {cameraPermissionError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                    <Camera className="mb-2 h-10 w-10 text-slate-400" />
                    <p className="text-sm">Không thể kết nối camera</p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                Căn chỉnh mã QR hội viên vào khung để tự động quét
              </p>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="flex flex-col items-center py-4">
              <div id="qr-file-temp" className="hidden" />
              <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-8 text-center transition hover:bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40">
                <Upload className="mb-3 h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Nhấp để tải ảnh QR
                </span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Hỗ trợ PNG, JPG, JPEG, WebP
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mã QR / ID Hội viên
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Dán hoặc gõ mã QR hội viên..."
                  autoFocus
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:bg-indigo-700"
              >
                Xác nhận & Check-in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
