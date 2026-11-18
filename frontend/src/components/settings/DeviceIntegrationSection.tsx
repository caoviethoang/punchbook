import { useState, useEffect, useCallback } from "react"
import {
  Cpu,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck,
  DoorClosed,
  QrCode,
  CreditCard,
  Circle,
  FileCode2,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Shop } from "../../lib/auth"
import { regenerateDeviceApiKey } from "../../lib/settings"
import {
  fetchHardwareDevices,
  updateHardwareDevice,
  deleteHardwareDevice,
  regenerateHardwareDeviceToken,
  type HardwareDevice,
  type DeviceType,
} from "../../lib/hardware"
import { AddDeviceModal } from "./hardware/AddDeviceModal"
import { HardwareLogsTable } from "./hardware/HardwareLogsTable"

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
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedDeviceId, setCopiedDeviceId] = useState<string | null>(null)
  const [loadingShopKey, setLoadingShopKey] = useState(false)

  // Hardware Devices State
  const [devices, setDevices] = useState<HardwareDevice[]>([])
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null)

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true)
    try {
      const data = await fetchHardwareDevices()
      setDevices(data)
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : t("settings.device.fetch_devices_failed", "Không thể tải danh sách thiết bị phần cứng"),
        "error",
      )
    } finally {
      setLoadingDevices(false)
    }
  }, [onToast, t])

  useEffect(() => {
    let isCancelled = false
    fetchHardwareDevices()
      .then((data) => {
        if (!isCancelled) setDevices(data)
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          onToast(
            err instanceof Error ? err.message : t("settings.device.fetch_devices_failed", "Không thể tải danh sách thiết bị phần cứng"),
            "error",
          )
        }
      })
      .finally(() => {
        if (!isCancelled) setLoadingDevices(false)
      })

    return () => {
      isCancelled = true
    }
  }, [onToast, t])

  async function handleCopyShopKey() {
    if (!shop.device_api_key) return
    try {
      await navigator.clipboard.writeText(shop.device_api_key)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
      onToast(t("settings.device.copy_success", "Đã sao chép Device API Key vào bộ nhớ tạm"), "success")
    } catch {
      onToast(t("settings.device.copy_failed", "Không thể sao chép, vui lòng copy thủ công"), "error")
    }
  }

  async function handleCopyDeviceToken(token: string, id: string) {
    try {
      await navigator.clipboard.writeText(token)
      setCopiedDeviceId(id)
      setTimeout(() => setCopiedDeviceId(null), 2000)
      onToast(t("settings.device.copy_token_success", "Đã sao chép Token thiết bị!"), "success")
    } catch {
      onToast(t("settings.device.copy_failed", "Không thể sao chép, vui lòng copy thủ công"), "error")
    }
  }

  async function handleRegenerateShopKey() {
    if (!confirm(t("settings.device.confirm_regenerate", "Bạn có chắc muốn tạo lại Device API Key? Thiết bị cũ đang dùng key này sẽ cần cập nhật lại."))) {
      return
    }

    setLoadingShopKey(true)
    try {
      const res = await regenerateDeviceApiKey()
      onShopUpdated(res.shop)
      onToast(t("settings.device.regenerate_success", "Tạo mới Device API Key thành công!"), "success")
    } catch (err) {
      onToast(err instanceof Error ? err.message : t("settings.device.regenerate_failed", "Tạo mới API Key thất bại"), "error")
    } finally {
      setLoadingShopKey(false)
    }
  }

  async function handleToggleDeviceActive(device: HardwareDevice) {
    setActionInProgressId(device.id)
    try {
      const updated = await updateHardwareDevice(device.id, {
        is_active: !device.is_active,
      })
      setDevices((prev) => prev.map((d) => (d.id === device.id ? updated : d)))
      onToast(
        updated.is_active
          ? t("settings.device.enabled_success", "Đã kích hoạt thiết bị")
          : t("settings.device.disabled_success", "Đã tạm dừng thiết bị"),
        "success",
      )
    } catch (err) {
      onToast(err instanceof Error ? err.message : t("settings.device.action_failed", "Thao tác thất bại"), "error")
    } finally {
      setActionInProgressId(null)
    }
  }

  async function handleRegenerateDeviceToken(device: HardwareDevice) {
    if (!confirm(t("settings.device.confirm_regenerate_token", "Bạn có chắc muốn cấp lại Token cho thiết bị này? Firmware ESP32 cần được nạp lại token mới."))) {
      return
    }

    setActionInProgressId(device.id)
    try {
      const updated = await regenerateHardwareDeviceToken(device.id)
      setDevices((prev) => prev.map((d) => (d.id === device.id ? updated : d)))
      onToast(t("settings.device.regenerate_token_success", "Đã cấp lại Token thiết bị thành công!"), "success")
    } catch (err) {
      onToast(err instanceof Error ? err.message : t("settings.device.action_failed", "Thao tác thất bại"), "error")
    } finally {
      setActionInProgressId(null)
    }
  }

  async function handleDeleteDevice(device: HardwareDevice) {
    if (!confirm(t("settings.device.confirm_delete", "Bạn có chắc muốn xóa thiết bị này khỏi hệ thống?"))) {
      return
    }

    setActionInProgressId(device.id)
    try {
      await deleteHardwareDevice(device.id)
      setDevices((prev) => prev.filter((d) => d.id !== device.id))
      onToast(t("settings.device.delete_success", "Đã xóa thiết bị thành công"), "success")
    } catch (err) {
      onToast(err instanceof Error ? err.message : t("settings.device.action_failed", "Thao tác thất bại"), "error")
    } finally {
      setActionInProgressId(null)
    }
  }

  function getDeviceTypeBadge(type: DeviceType) {
    switch (type) {
      case "turnstile":
        return {
          label: t("settings.device.types.turnstile_short", "Cổng xoay ba càng"),
          icon: ShieldCheck,
          color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400",
        }
      case "magnetic_lock":
        return {
          label: t("settings.device.types.magnetic_lock_short", "Khóa từ"),
          icon: DoorClosed,
          color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
        }
      case "barcode_scanner":
        return {
          label: t("settings.device.types.barcode_scanner_short", "Máy quét QR"),
          icon: QrCode,
          color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400",
        }
      case "nfc_reader":
        return {
          label: t("settings.device.types.nfc_reader_short", "Đầu đọc RFID/NFC"),
          icon: CreditCard,
          color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
        }
      default:
        return {
          label: type,
          icon: Cpu,
          color: "text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300",
        }
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("settings.device.title", "Tích hợp Phần cứng & Cổng kiểm soát (IoT Access Control)")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("settings.device.subtitle", "Quản lý cổng xoay ba càng, khóa từ điện tử, đầu đọc RFID & QR scanner.")}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            <Plus className="h-4 w-4" />
            <span>{t("settings.device.add_device_btn", "Thêm thiết bị mới")}</span>
          </button>
        )}
      </div>

      {/* Hardware Fleet Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
            {t("settings.device.fleet_title", "Danh sách thiết bị kết nối")} ({devices.length})
          </h4>
          <button
            type="button"
            onClick={() => void loadDevices()}
            disabled={loadingDevices}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title={t("common.refresh", "Làm mới")}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingDevices ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loadingDevices ? (
          <div className="flex h-24 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-sky-500" />
          </div>
        ) : devices.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
            <Cpu className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              {t("settings.device.no_devices", "Chưa có thiết bị ngoại vi nào được kết nối.")}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {t("settings.device.no_devices_hint", "Thêm cổng xoay hoặc đầu đọc thẻ để tự động nhả chốt khi hội viên quẹt thẻ.")}
            </p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">{t("settings.device.col_name", "Thiết bị & Loại")}</th>
                  <th className="px-4 py-3">{t("settings.device.col_location", "Vị trí")}</th>
                  <th className="px-4 py-3">{t("settings.device.col_status", "Trạng thái")}</th>
                  <th className="px-4 py-3">{t("settings.device.col_token", "Device Token")}</th>
                  <th className="px-4 py-3 text-right">{t("settings.device.col_actions", "Thao tác")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {devices.map((device) => {
                  const typeBadge = getDeviceTypeBadge(device.device_type)
                  const TypeIcon = typeBadge.icon
                  const isActioning = actionInProgressId === device.id

                  return (
                    <tr key={device.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${typeBadge.color}`}>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {device.name}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {typeBadge.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {device.location || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {device.online ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                              </span>
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              <Circle className="h-2 w-2 fill-slate-400 text-slate-400" />
                              Offline
                            </span>
                          )}
                          {!device.is_active && (
                            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                              {t("settings.device.disabled_badge", "Đã tắt")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {device.device_token.slice(0, 12)}...
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyDeviceToken(device.device_token, device.id)}
                            title={t("settings.device.copy_token", "Sao chép Token")}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            {copiedDeviceId === device.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleDeviceActive(device)}
                              disabled={isActioning}
                              title={
                                device.is_active
                                  ? t("settings.device.disable_btn", "Tạm dừng thiết bị")
                                  : t("settings.device.enable_btn", "Kích hoạt thiết bị")
                              }
                              className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                                device.is_active
                                  ? "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                              }`}
                            >
                              {device.is_active
                                ? t("common.pause", "Tắt")
                                : t("common.enable", "Bật")}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRegenerateDeviceToken(device)}
                              disabled={isActioning}
                              title={t("settings.device.regenerate_token_btn", "Cấp lại Token")}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              <RefreshCw className={`h-3 w-3 ${isActioning ? "animate-spin" : ""}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDevice(device)}
                              disabled={isActioning}
                              title={t("common.delete", "Xóa")}
                              className="rounded-lg border border-slate-200 p-1.5 text-rose-500 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Firmware & Documentation banner */}
      <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-xs text-sky-900 sm:flex-row sm:items-center sm:justify-between dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
          <span>
            {t(
              "settings.device.docs_hint",
              "Sơ đồ đấu nối ESP32 + Rơ-le 12V và mã nguồn Firmware tham khảo có sẵn trong thư mục `docs/iot` của dự án.",
            )}
          </span>
        </div>
      </div>

      {/* Legacy Shop-wide Device API Key */}
      <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
          {t("settings.device.legacy_key_section", "Device API Key chung của Phòng (Legacy)")}
        </h4>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("settings.device.endpoint_label", "Endpoint Check-in thiết bị")}
            </label>
            <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              POST /api/v1/hardware/check_in
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {t("settings.device.endpoint_hint_prefix", "Gửi Header")}{" "}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">X-Device-Token</code>{" "}
              {t("settings.device.endpoint_or", "hoặc")}{" "}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">X-Device-Api-Key</code>{" "}
              {t("settings.device.endpoint_hint_suffix", "cùng body JSON:")}{" "}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">
                &#123;&quot;identifier&quot;: &quot;{t("settings.device.card_code_or_phone", "Mã thẻ / SĐT")}&quot;&#125;
              </code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("settings.device.api_key_label", "Device API Key")}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shop.device_api_key || t("settings.device.no_api_key", "Chưa tạo API Key")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-800 outline-none select-all dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={handleCopyShopKey}
                disabled={!shop.device_api_key}
                title={t("settings.device.copy_key", "Sao chép Device API Key")}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {copiedKey ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleRegenerateShopKey}
                  disabled={loadingShopKey}
                  title={t("settings.device.regenerate_key", "Tạo lại API Key mới")}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingShopKey ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Access Stream */}
      <HardwareLogsTable onToast={onToast} />

      {/* Add Device Modal */}
      {isAddModalOpen && (
        <AddDeviceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onDeviceAdded={(newDev) => setDevices((prev) => [newDev, ...prev])}
          onToast={onToast}
        />
      )}
    </div>
  )
}
