import { Camera, CameraOff, QrCode, RefreshCw } from "lucide-react"
import { useEffect, useRef, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"

interface KioskCameraScannerProps {
  onScan: (scannedValue: string) => void
  disabled?: boolean
  autoStart?: boolean
}

export function KioskCameraScanner({
  onScan,
  disabled = false,
  autoStart = true,
}: KioskCameraScannerProps) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [cameraActive, setCameraActive] = useState<boolean>(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const scanIntervalRef = useRef<number | null>(null)
  const lastScannedRef = useRef<string>("")
  const lastScanTimeRef = useRef<number>(0)

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setCameraActive(false)
  }, [stream])

  const startCamera = useCallback(async () => {
    if (disabled || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setHasPermission(false)
      return
    }

    try {
      stopCamera()
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      setStream(mediaStream)
      setHasPermission(true)
      setCameraActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play().catch(() => {})
      }
    } catch {
      setHasPermission(false)
      setCameraActive(false)
    }
  }, [disabled, facingMode, stopCamera])

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  // Barcode / QR detection loop using BarcodeDetector if available
  useEffect(() => {
    if (!cameraActive || disabled) return

    const handleDetected = (rawCode: string) => {
      const now = Date.now()
      // Throttle identical scans within 3 seconds
      if (rawCode === lastScannedRef.current && now - lastScanTimeRef.current < 3000) {
        return
      }
      lastScannedRef.current = rawCode
      lastScanTimeRef.current = now
      onScan(rawCode)
    }

    type BarcodeDetectorInstance = {
      detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>
    }

    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorInstance }).BarcodeDetector

    if (BarcodeDetectorClass) {
      try {
        const detector = new BarcodeDetectorClass({ formats: ["qr_code", "code_128", "ean_13"] })
        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              handleDetected(barcodes[0].rawValue)
            }
          } catch {
            // Scanner read error, ignore frame
          }
        }, 250)
      } catch {
        // Fallback or unsupported formats
      }
    }

    return () => {
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }
    }
  }, [cameraActive, disabled, onScan])

  useEffect(() => {
    if (!autoStart || disabled || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return
    }

    let isCancelled = false

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((mediaStream) => {
        if (isCancelled) {
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }
        setStream(mediaStream)
        setHasPermission(true)
        setCameraActive(true)

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play().catch(() => {})
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setHasPermission(false)
          setCameraActive(false)
        }
      })

    return () => {
      isCancelled = true
      stopCamera()
    }
  }, [autoStart, disabled, facingMode, stopCamera])

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[280px] sm:min-h-[340px] rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${cameraActive ? "opacity-100" : "opacity-0"}`}
      />

      {/* Camera Off / Permission fallback view */}
      {(!cameraActive || hasPermission === false) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 text-slate-300">
          <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-3xl bg-slate-800/80 text-emerald-400 border border-slate-700/60 shadow-lg">
            <QrCode className="w-8 h-8" />
          </div>
          <p className="text-base font-bold text-white mb-1">
            {t("kiosk.scanner_ready", "Quét mã QR Hội viên")}
          </p>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            {hasPermission === false
              ? t("kiosk.camera_permission_denied", "Không thể mở camera. Vui lòng cấp quyền hoặc dùng bàn phím số bên phải.")
              : t("kiosk.camera_hint", "Hướng mã QR trên ứng dụng hoặc thẻ hội viên vào khung hình để điểm danh.")}
          </p>
          <button
            type="button"
            onClick={() => void startCamera()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-emerald-500/30 transition shadow-sm"
          >
            <Camera className="w-4 h-4" />
            <span>{t("kiosk.reopen_camera", "Mở lại Camera")}</span>
          </button>
        </div>
      )}

      {/* Futuristic Scanner Bounding Box & Animated Laser */}
      {cameraActive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-500/40 rounded-3xl">
            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

            {/* Scanning Laser Beam */}
            <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse top-1/2 -translate-y-1/2" />
          </div>

          <div className="absolute bottom-4 inset-x-0 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-xs text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
              {t("kiosk.align_qr_hint", "Đặt mã QR vào trong khung")}
            </span>
          </div>
        </div>
      )}

      {/* Camera Toggle Controls */}
      {cameraActive && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFacingMode}
            title={t("kiosk.switch_camera", "Đổi camera")}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-xs border border-slate-700/60 shadow-md transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={stopCamera}
            title={t("kiosk.stop_camera", "Tắt camera")}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-xs border border-slate-700/60 shadow-md transition"
          >
            <CameraOff className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
