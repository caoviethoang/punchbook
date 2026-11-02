import { useState } from "react"
import { useTranslation } from "react-i18next"
import { X, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import type { Shop } from "../../lib/auth"
import { sendTestNotification } from "../../lib/notifications"

interface TestNotificationModalProps {
  isOpen: boolean
  shop: Shop
  onClose: () => void
  onSuccess?: () => void
}

export function TestNotificationModal({
  isOpen,
  shop,
  onClose,
  onSuccess,
}: TestNotificationModalProps) {
  const { t } = useTranslation()
  const [channel, setChannel] = useState<"email" | "sms" | "zalo">("email")
  const [recipient, setRecipient] = useState<string>(shop.email || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen) return null

  function handleChannelChange(newChannel: "email" | "sms" | "zalo") {
    setChannel(newChannel)
    setError(null)
    setSuccessMessage(null)
    if (newChannel === "email") {
      setRecipient(shop.email || "")
    } else {
      setRecipient(shop.phone || "")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!recipient.trim()) {
      setError(t("settings.notifications.recipient_required", "Vui lòng nhập địa chỉ nhận"))
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const res = await sendTestNotification({
        channel,
        recipient: recipient.trim(),
      })
      setSuccessMessage(res.message || t("settings.notifications.test_success", "Đã gửi thông báo thử nghiệm thành công!"))
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.notifications.test_failed", "Gửi thông báo thử nghiệm thất bại"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("settings.notifications.test_modal_title", "Gửi thông báo thử nghiệm")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("settings.notifications.test_modal_subtitle", "Kiểm tra kết nối và mẫu thông báo thực tế tới người nhận.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("settings.notifications.test_channel_label", "Kênh thông báo")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleChannelChange("email")}
                className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                  channel === "email"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => handleChannelChange("sms")}
                className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                  channel === "sms"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                SMS
              </button>
              <button
                type="button"
                onClick={() => handleChannelChange("zalo")}
                className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                  channel === "zalo"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Zalo ZNS
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("settings.notifications.test_recipient_label", "Địa chỉ nhận (Email hoặc Số điện thoại)")}
            </label>
            <input
              type={channel === "email" ? "email" : "tel"}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={t("settings.notifications.test_recipient_placeholder", "Nhập email hoặc SĐT nhận thử...")}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t("common.cancel", "Hủy")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("settings.notifications.test_sending", "Đang gửi...")}</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>{t("settings.notifications.test_send_btn", "Gửi thử ngay")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
