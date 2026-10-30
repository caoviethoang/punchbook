import { useState } from "react"
import { Cpu, Copy, Check, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Shop } from "../../lib/auth"
import { regenerateDeviceApiKey } from "../../lib/settings"

interface DeviceIntegrationSectionProps {
  shop: Shop
  isAdmin: boolean
  onShopUpdated: (shop: Shop) => void
  onToast: (message: string, type: "success" | "error") => void
}

export function DeviceIntegrationSection({
  shop,
  isAdmin,
  onShopUpdated,
  onToast,
}: DeviceIntegrationSectionProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCopy() {
    if (!shop.device_api_key) return
    try {
      await navigator.clipboard.writeText(shop.device_api_key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onToast(t("settings.device.copy_success", "Đã sao chép Device API Key vào bộ nhớ tạm"), "success")
    } catch {
      onToast("Không thể sao chép, vui lòng copy thủ công", "error")
    }
  }

  async function handleRegenerate() {
    if (!confirm(t("settings.device.confirm_regenerate", "Bạn có chắc muốn tạo lại Device API Key? Thiết bị cũ đang dùng key này sẽ cần cập nhật lại."))) {
      return
    }

    setLoading(true)
    try {
      const res = await regenerateDeviceApiKey()
      onShopUpdated(res.shop)
      onToast(t("settings.device.regenerate_success", "Tạo mới Device API Key thành công!"), "success")
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Tạo mới API Key thất bại", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t("settings.device.title", "Tích hợp Thiết bị phần cứng (FaceID / Vân tay / Thẻ từ)")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("settings.device.subtitle", "Kết nối đầu đọc thẻ hoặc máy chấm công để check-in tự động.")}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Endpoint Check-in thiết bị
          </label>
          <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            POST /api/v1/hardware/check_in
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Gửi Header <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">X-Device-Api-Key</code> cùng body JSON:{" "}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">&#123;&quot;identifier&quot;: &quot;Mã thẻ / SĐT&quot;&#125;</code>
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Device API Key
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shop.device_api_key || "Chưa tạo API Key"}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-800 outline-none select-all dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            />
            <button
              type="button"
              onClick={handleCopy}
              disabled={!shop.device_api_key}
              title="Sao chép Device API Key"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={loading}
                title="Tạo lại API Key mới"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
