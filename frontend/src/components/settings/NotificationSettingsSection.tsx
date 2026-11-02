import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Bell, Mail, MessageSquare, Smartphone, Send, Loader2 } from "lucide-react"
import type { Shop } from "../../lib/auth"
import { updateShopProfile } from "../../lib/settings"
import { TestNotificationModal } from "./TestNotificationModal"
import { NotificationHistoryTable } from "./NotificationHistoryTable"

interface NotificationSettingsSectionProps {
  shop: Shop
  isAdmin: boolean
  onShopUpdated: (updatedShop: Shop) => void
  onToast: (message: string, type: "success" | "error") => void
}

export function NotificationSettingsSection({
  shop,
  isAdmin,
  onShopUpdated,
  onToast,
}: NotificationSettingsSectionProps) {
  const { t } = useTranslation()
  const [emailEnabled, setEmailEnabled] = useState(shop.email_notifications_enabled ?? true)
  const [smsEnabled, setSmsEnabled] = useState(shop.sms_notifications_enabled ?? false)
  const [zaloEnabled, setZaloEnabled] = useState(shop.zalo_notifications_enabled ?? true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  async function handleToggle(
    key: "email_notifications_enabled" | "sms_notifications_enabled" | "zalo_notifications_enabled",
    newValue: boolean
  ) {
    if (!isAdmin) return
    setSavingKey(key)

    const updatedState = {
      email_notifications_enabled: key === "email_notifications_enabled" ? newValue : emailEnabled,
      sms_notifications_enabled: key === "sms_notifications_enabled" ? newValue : smsEnabled,
      zalo_notifications_enabled: key === "zalo_notifications_enabled" ? newValue : zaloEnabled,
    }

    if (key === "email_notifications_enabled") setEmailEnabled(newValue)
    if (key === "sms_notifications_enabled") setSmsEnabled(newValue)
    if (key === "zalo_notifications_enabled") setZaloEnabled(newValue)

    try {
      const res = await updateShopProfile({
        name: shop.name,
        phone: shop.phone || "",
        address: shop.address || "",
        ...updatedState,
      })
      onShopUpdated(res.shop)
      onToast(t("settings.notifications.save_success", "Cập nhật cấu hình thông báo thành công"), "success")
    } catch (err) {
      // Revert on error
      if (key === "email_notifications_enabled") setEmailEnabled(!newValue)
      if (key === "sms_notifications_enabled") setSmsEnabled(!newValue)
      if (key === "zalo_notifications_enabled") setZaloEnabled(!newValue)
      onToast(err instanceof Error ? err.message : t("settings.notifications.save_failed", "Cập nhật cấu hình thông báo thất bại"), "error")
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("settings.notifications.title", "Cấu hình Thông báo Đa kênh (Multi-channel Notifications)")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                "settings.notifications.subtitle",
                "Tự động gửi thông báo chào mừng, biên lai check-in, xác nhận thanh toán và nhắc hạn qua Zalo ZNS, SMS hoặc Email."
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsTestModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{t("settings.notifications.test_btn", "Gửi thông báo thử nghiệm")}</span>
        </button>
      </div>

      {/* Channel Toggles Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Email toggle */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>{t("settings.notifications.email_title", "Thông báo qua Email (Khuyên dùng)")}</span>
              </div>
              {savingKey === "email_notifications_enabled" ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              ) : (
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    aria-label="Toggle Email notifications"
                    checked={emailEnabled}
                    disabled={!isAdmin}
                    onChange={(e) => handleToggle("email_notifications_enabled", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden dark:bg-slate-700 dark:peer-checked:bg-indigo-500"></div>
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                "settings.notifications.email_desc",
                "Gửi hóa đơn, biên nhận check-in và thư nhắc hạn định dạng HTML đẹp mắt đến địa chỉ email hội viên. Miễn phí."
              )}
            </p>
          </div>
        </div>

        {/* Zalo toggle */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Smartphone className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span>{t("settings.notifications.zalo_title", "Thông báo Zalo ZNS (Zalo Notification Service)")}</span>
              </div>
              {savingKey === "zalo_notifications_enabled" ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              ) : (
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    aria-label="Toggle Zalo notifications"
                    checked={zaloEnabled}
                    disabled={!isAdmin}
                    onChange={(e) => handleToggle("zalo_notifications_enabled", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden dark:bg-slate-700 dark:peer-checked:bg-indigo-500"></div>
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                "settings.notifications.zalo_desc",
                "Gửi tin nhắn mẫu đã xác thực từ Zalo Official Account (OA) của phòng tập đến số Zalo hội viên."
              )}
            </p>
          </div>
        </div>

        {/* SMS toggle */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>{t("settings.notifications.sms_title", "Thông báo qua SMS Gateway (eSMS / SpeedSMS)")}</span>
              </div>
              {savingKey === "sms_notifications_enabled" ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              ) : (
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    aria-label="Toggle SMS notifications"
                    checked={smsEnabled}
                    disabled={!isAdmin}
                    onChange={(e) => handleToggle("sms_notifications_enabled", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden dark:bg-slate-700 dark:peer-checked:bg-indigo-500"></div>
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                "settings.notifications.sms_desc",
                "Gửi tin nhắn SMS trực tiếp đến số điện thoại hội viên khi Zalo ZNS không kích hoạt hoặc gửi không thành công."
              )}
            </p>
          </div>
        </div>
      </div>

      <hr className="border-slate-100 dark:border-slate-800" />

      {/* History table */}
      <NotificationHistoryTable refreshTrigger={refreshTrigger} />

      {/* Test Modal */}
      <TestNotificationModal
        isOpen={isTestModalOpen}
        shop={shop}
        onClose={() => setIsTestModalOpen(false)}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1)
          onToast(t("settings.notifications.test_success", "Đã gửi thông báo thử nghiệm thành công!"), "success")
        }}
      />
    </div>
  )
}
