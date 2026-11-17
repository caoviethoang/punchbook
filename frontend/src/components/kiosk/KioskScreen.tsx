import { Lock, Maximize2, Minimize2, Volume2, VolumeX, Sparkles, Building2 } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  fetchKioskConfig,
  getStoredKioskToken,
  kioskCheckIn,
  loginKiosk,
  type KioskCheckInResult,
  type KioskConfig,
} from "../../lib/kiosk"
import { playErrorChime, playMilestoneChime, playSuccessChime, speakKioskGreeting } from "../../lib/kioskAudio"
import { KioskCameraScanner } from "./KioskCameraScanner"
import { KioskDeniedView } from "./KioskDeniedView"
import { KioskKeypad } from "./KioskKeypad"
import { KioskPinModal } from "./KioskPinModal"
import { KioskSuccessView } from "./KioskSuccessView"

interface KioskScreenProps {
  onExit?: () => void
  initialToken?: string | null
}

export function KioskScreen({ onExit, initialToken }: KioskScreenProps) {
  const { t } = useTranslation()
  const [token, setToken] = useState<string | null>(() => initialToken || getStoredKioskToken())
  const [config, setConfig] = useState<KioskConfig | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(() => Boolean(initialToken || getStoredKioskToken()))
  const [inputIdentifier, setInputIdentifier] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [activeResult, setActiveResult] = useState<KioskCheckInResult | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [pinModalMode, setPinModalMode] = useState<"unlock" | "exit">("unlock")
  const [currentTime, setCurrentTime] = useState(new Date())
  const lastScannedIdRef = useRef<string>("")

  // Live clock
  useEffect(() => {
    const clockTimer = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => window.clearInterval(clockTimer)
  }, [])

  // Load Kiosk Config on mount / token change
  useEffect(() => {
    if (!token) return

    let isCancelled = false
    fetchKioskConfig(token)
      .then((data) => {
        if (!isCancelled) {
          setConfig(data)
          setAudioEnabled(data.kiosk.audio_enabled)
          setLoadingConfig(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setToken(null)
          setLoadingConfig(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [token])

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const resetToStandby = useCallback(() => {
    setActiveResult(null)
    setInputIdentifier("")
    setSubmitting(false)
    lastScannedIdRef.current = ""
  }, [])

  // Execute check-in
  const handleCheckIn = useCallback(
    async (rawIdentifier: string) => {
      const clean = rawIdentifier.trim()
      if (!clean || submitting) return

      setSubmitting(true)
      try {
        const result = await kioskCheckIn(clean, token || undefined)
        setActiveResult(result)

        if (result.status === "success") {
          if (result.milestone_reached) {
            playMilestoneChime()
          } else {
            playSuccessChime()
          }
        } else {
          playErrorChime()
        }

        if (result.audio_text) {
          speakKioskGreeting(result.audio_text, audioEnabled)
        }
      } catch (err) {
        playErrorChime()
        const errMsg = err instanceof Error ? err.message : t("kiosk.checkin_failed", "Lỗi kiểm tra check-in")
        setActiveResult({
          status: "denied",
          code: "REQUEST_ERROR",
          message: errMsg,
          audio_text: errMsg,
        })
        speakKioskGreeting(errMsg, audioEnabled)
      } finally {
        setSubmitting(false)
      }
    },
    [audioEnabled, submitting, t, token],
  )

  // Handle successful self-renewal via VietQR / payOS
  const handlePaidSuccess = useCallback(() => {
    if (activeResult?.membership) {
      void handleCheckIn(activeResult.membership.id)
    }
  }, [activeResult, handleCheckIn])

  // Handle PIN unlock or exit
  const handlePinSubmit = async (pin: string) => {
    if (pinModalMode === "unlock") {
      const res = await loginKiosk(pin)
      setToken(res.kiosk_token)
      setIsPinModalOpen(false)
      const data = await fetchKioskConfig(res.kiosk_token)
      setConfig(data)
      setAudioEnabled(data.kiosk.audio_enabled)
      return true
    } else if (pinModalMode === "exit") {
      // Exit back to main dashboard
      setIsPinModalOpen(false)
      if (onExit) {
        onExit()
      } else {
        window.location.hash = "#/dashboard"
      }
      return true
    }
  }

  // Standby or locked view
  const shopName = config?.shop.name || t("kiosk.brand_default", "PunchBook Kiosk")
  const welcomeMsg = config?.kiosk.welcome_message || t("kiosk.welcome_default", "Chào mừng bạn đến với phòng tập!")

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 select-none overflow-x-hidden font-sans">
      {/* Top Bar / Kiosk Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-950/40">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{shopName}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                {t("kiosk.badge_active", "Kiosk")}
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">{welcomeMsg}</p>
          </div>
        </div>

        {/* Live Clock & Right Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-lg font-black font-mono text-white tracking-wider">
              {currentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="text-[11px] text-slate-400">
              {currentTime.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setAudioEnabled((prev) => !prev)}
              title={audioEnabled ? t("kiosk.mute_sound", "Tắt âm thanh") : t("kiosk.unmute_sound", "Bật âm thanh")}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={t("kiosk.toggle_fullscreen", "Toàn màn hình")}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Exit Kiosk Button (Requires PIN) */}
            <button
              type="button"
              onClick={() => {
                setPinModalMode("exit")
                setIsPinModalOpen(true)
              }}
              title={t("kiosk.exit_kiosk", "Thoát chế độ Kiosk")}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition border border-slate-700/60"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-6xl w-full mx-auto">
        {loadingConfig ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold">{t("kiosk.loading_config", "Đang khởi tạo màn hình Kiosk...")}</p>
          </div>
        ) : !token ? (
          /* Locked / Unauthenticated Kiosk View */
          <div className="flex flex-col items-center justify-center max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">{t("kiosk.locked_title", "Thiết bị Kiosk chưa kích hoạt")}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {t("kiosk.locked_desc", "Vui lòng nhập mã PIN quản trị để kết nối thiết bị này với phòng tập của bạn.")}
            </p>
            <button
              type="button"
              onClick={() => {
                setPinModalMode("unlock")
                setIsPinModalOpen(true)
              }}
              className="mt-6 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition shadow-lg shadow-emerald-950/50"
            >
              {t("kiosk.unlock_now", "Nhập PIN kích hoạt Kiosk")}
            </button>
          </div>
        ) : activeResult?.status === "success" ? (
          /* Check-In Success State */
          <KioskSuccessView
            result={activeResult}
            onReset={resetToStandby}
            autoResetSeconds={config?.kiosk.auto_reset_seconds || 3}
          />
        ) : activeResult?.status === "denied" ? (
          /* Check-In Denied / Expired State with VietQR Renewal */
          <KioskDeniedView
            result={activeResult}
            onReset={resetToStandby}
            onPaidSuccess={handlePaidSuccess}
            kioskToken={token || undefined}
          />
        ) : (
          /* Standby Screen: Camera Scanner on Left, Touch Keypad on Right */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl items-center animate-in fade-in duration-300">
            {/* Left Column: Live QR Camera Scanner */}
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[320px] sm:min-h-[420px]">
              <div className="w-full mb-3 flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {t("kiosk.camera_scanner_title", "Quét mã QR tự động")}
                </span>
                <span className="text-slate-500">{t("kiosk.step_1_hint", "Cách 1")}</span>
              </div>
              <KioskCameraScanner
                onScan={(code) => void handleCheckIn(code)}
                disabled={submitting}
              />
            </div>

            {/* Right Column: Touch Numeric Keypad */}
            <div className="flex flex-col items-center justify-center w-full h-full p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="w-full mb-3 flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                <span className="uppercase tracking-wider text-slate-300">
                  {t("kiosk.numeric_keypad_title", "Hoặc nhập Số điện thoại")}
                </span>
                <span className="text-slate-500">{t("kiosk.step_2_hint", "Cách 2")}</span>
              </div>

              <KioskKeypad
                value={inputIdentifier}
                onChange={setInputIdentifier}
                onSubmit={(val) => void handleCheckIn(val)}
                disabled={submitting}
                placeholder={t("kiosk.enter_phone_placeholder", "Nhập SĐT hoặc quẹt thẻ")}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="py-3 text-center text-xs text-slate-600 border-t border-slate-900">
        <p>{t("kiosk.powered_by", "PunchBook Kiosk — Hệ thống điểm danh tự phục vụ thông minh")}</p>
      </footer>

      {/* PIN Unlock / Exit Modal */}
      <KioskPinModal
        isOpen={isPinModalOpen}
        title={pinModalMode === "unlock" ? t("kiosk.pin_unlock_title", "Kích hoạt Kiosk") : t("kiosk.pin_exit_title", "Thoát chế độ Kiosk")}
        subtitle={pinModalMode === "unlock" ? t("kiosk.pin_unlock_desc", "Nhập mã PIN Kiosk đã cấu hình trong cài đặt") : t("kiosk.pin_exit_desc", "Nhập mã PIN để quay lại bảng điều khiển nhân viên")}
        onSubmit={handlePinSubmit}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  )
}
