import { Monitor, Copy, Check, RefreshCw, ExternalLink, Volume2, ShieldCheck, Save, Loader2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Shop } from "../../lib/auth"
import { setStoredKioskToken } from "../../lib/kiosk"
import { regenerateKioskToken, updateShopProfile } from "../../lib/settings"

interface KioskSettingsSectionProps {
  shop: Shop
  isAdmin: boolean
  onShopUpdated: (shop: Shop) => void
  onToast: (message: string, type: "success" | "error") => void
}

export function KioskSettingsSection({
  shop,
  isAdmin,
  onShopUpdated,
  onToast,
}: KioskSettingsSectionProps) {
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState(shop.kiosk_enabled ?? false)
  const [pin, setPin] = useState(shop.kiosk_pin || "1234")
  const [welcomeMessage, setWelcomeMessage] = useState(
    shop.kiosk_welcome_message || "Chào mừng bạn đến với phòng tập!",
  )
  const [audioEnabled, setAudioEnabled] = useState(shop.kiosk_audio_enabled ?? true)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const kioskUrl = typeof window !== "undefined"
    ? `${window.location.origin}/#/kiosk${shop.kiosk_token ? `?token=${encodeURIComponent(shop.kiosk_token)}` : ""}`
    : "#/kiosk"

  async function handleSaveSettings() {
    if (!isAdmin) return
    setSaving(true)
    try {
      const res = await updateShopProfile({
        name: shop.name,
        phone: shop.phone || "",
        address: shop.address || "",
        kiosk_enabled: enabled,
        kiosk_pin: pin.trim(),
        kiosk_welcome_message: welcomeMessage.trim(),
        kiosk_audio_enabled: audioEnabled,
      })
      onShopUpdated(res.shop)
      if (res.shop.kiosk_token) {
        setStoredKioskToken(res.shop.kiosk_token)
      }
      onToast(t("settings.kiosk.save_success", "Lưu cài đặt Kiosk thành công!"), "success")
    } catch (err) {
      onToast(err instanceof Error ? err.message : t("settings.kiosk.save_failed", "Lưu cài đặt thất bại"), "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerateToken() {
    if (!isAdmin) return
    if (
      !confirm(
        t(
          "settings.kiosk.confirm_regenerate",
          "Bạn có chắc muốn tạo lại Kiosk Token? Thiết bị Kiosk cũ sẽ cần quét lại hoặc nhập PIN để kích hoạt lại.",
        ),
      )
    ) {
      return
    }

    setRegenerating(true)
    try {
      const res = await regenerateKioskToken()
      onShopUpdated(res.shop)
      if (res.shop.kiosk_token) {
        setStoredKioskToken(res.shop.kiosk_token)
      }
      onToast(t("settings.kiosk.regenerate_success", "Tạo mới Kiosk Token thành công!"), "success")
    } catch (err) {
      onToast(err instanceof Error ? err.message : t("settings.kiosk.regenerate_failed", "Tạo mới token thất bại"), "error")
    } finally {
      setRegenerating(false)
    }
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(kioskUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onToast(t("settings.kiosk.copy_url_success", "Đã sao chép link Kiosk vào bộ nhớ tạm"), "success")
    } catch {
      onToast(t("settings.kiosk.copy_url_failed", "Không thể sao chép"), "error")
    }
  }

  function handleOpenKiosk() {
    if (shop.kiosk_token) {
      setStoredKioskToken(shop.kiosk_token)
    }
    window.open(kioskUrl, "_blank")
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{t("settings.kiosk.title", "Kiosk Check-in Tự phục vụ (Self-Service Kiosk)")}</span>
              {enabled && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {t("settings.kiosk.status_active", "Đang bật")}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                "settings.kiosk.subtitle",
                "Màn hình toàn màn hình cho tablet hoặc máy tính bảng gắn tại cửa để hội viên tự check-in bằng QR hoặc SĐT.",
              )}
            </p>
          </div>
        </div>

        {/* Quick Launch Button */}
        {enabled && (
          <button
            type="button"
            onClick={handleOpenKiosk}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:from-teal-500 hover:to-emerald-500 transition"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{t("settings.kiosk.open_kiosk_btn", "Mở màn hình Kiosk")}</span>
          </button>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {/* Toggle Enable Kiosk */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t("settings.kiosk.enable_toggle", "Kích hoạt Kiosk tự phục vụ")}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("settings.kiosk.enable_desc", "Cho phép mở màn hình check-in tự phục vụ tại địa chỉ /kiosk")}
            </p>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            disabled={!isAdmin}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-5 w-5 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500"
          />
        </div>

        {/* PIN Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("settings.kiosk.pin_label", "Mã PIN Kiosk (4-6 chữ số)")}</span>
            </label>
            <input
              type="password"
              maxLength={8}
              value={pin}
              disabled={!isAdmin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="1234"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 font-mono tracking-widest outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("settings.kiosk.audio_label", "Âm thanh & Giọng đọc chào mừng")}</span>
            </label>
            <div className="flex items-center h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {audioEnabled ? t("common.enabled", "Đang bật") : t("common.disabled", "Đã tắt")}
              </span>
              <input
                type="checkbox"
                checked={audioEnabled}
                disabled={!isAdmin}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                className="h-4 w-4 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t("settings.kiosk.welcome_msg_label", "Lời chào mừng trên Kiosk")}
          </label>
          <input
            type="text"
            value={welcomeMessage}
            disabled={!isAdmin}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder={t("kiosk.welcome_default", "Chào mừng bạn đến với phòng tập!")}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Kiosk URL Box */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t("settings.kiosk.url_label", "Đường dẫn Kiosk cho thiết bị")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={kioskUrl}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 select-all"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? t("common.copied", "Đã chép") : t("common.copy", "Sao chép")}</span>
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={!isAdmin || regenerating}
            onClick={handleRegenerateToken}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
            <span>{t("settings.kiosk.regenerate_token_btn", "Tạo lại Kiosk Token")}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-500 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{t("common.save_settings", "Lưu cài đặt")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
