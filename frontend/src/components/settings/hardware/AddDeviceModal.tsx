import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Cpu, DoorClosed, QrCode, CreditCard, ShieldCheck } from "lucide-react"
import { Modal } from "../../ui/Modal"
import {
  createHardwareDevice,
  type DeviceType,
  type HardwareDevice,
} from "../../../lib/hardware"

interface AddDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onDeviceAdded: (device: HardwareDevice) => void
  onToast: (message: string, type: "success" | "error") => void
}

export function AddDeviceModal({
  isOpen,
  onClose,
  onDeviceAdded,
  onToast,
}: AddDeviceModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [deviceType, setDeviceType] = useState<DeviceType>("turnstile")
  const [location, setLocation] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const deviceTypes: { type: DeviceType; label: string; desc: string; icon: typeof Cpu }[] = [
    {
      type: "turnstile",
      label: t("settings.device.types.turnstile", "Cổng xoay ba càng (Tripod Turnstile)"),
      desc: t("settings.device.types.turnstile_desc", "Xung kích mở tiếp điểm khô 1.5s"),
      icon: ShieldCheck,
    },
    {
      type: "magnetic_lock",
      label: t("settings.device.types.magnetic_lock", "Khóa từ nam châm điện (Magnetic Lock)"),
      desc: t("settings.device.types.magnetic_lock_desc", "Ngắt nguồn nhả chốt cửa 3.0s"),
      icon: DoorClosed,
    },
    {
      type: "barcode_scanner",
      label: t("settings.device.types.barcode_scanner", "Máy quét mã vạch / QR Code"),
      desc: t("settings.device.types.barcode_scanner_desc", "Nhận dạng mã hội viên quét từ app hoặc vé"),
      icon: QrCode,
    },
    {
      type: "nfc_reader",
      label: t("settings.device.types.nfc_reader", "Đầu đọc thẻ từ RFID / NFC"),
      desc: t("settings.device.types.nfc_reader_desc", "Quét thẻ Mifare 13.56MHz"),
      icon: CreditCard,
    },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      onToast(t("settings.device.name_required", "Vui lòng nhập tên thiết bị"), "error")
      return
    }

    setSubmitting(true)
    try {
      const device = await createHardwareDevice({
        name: name.trim(),
        device_type: deviceType,
        location: location.trim() || undefined,
        is_active: true,
      })
      onDeviceAdded(device)
      onToast(t("settings.device.create_success", "Đã thêm thiết bị phần cứng mới thành công!"), "success")
      setName("")
      setLocation("")
      setDeviceType("turnstile")
      onClose()
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : t("settings.device.create_failed", "Thêm thiết bị thất bại"),
        "error",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("settings.device.add_modal_title", "Thêm thiết bị phần cứng mới")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("settings.device.add_modal_subtitle", "Khai báo cổng xoay, khóa từ hoặc đầu đọc ngoại vi.")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("settings.device.name_label", "Tên thiết bị")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("settings.device.name_placeholder", "Ví dụ: Cổng xoay số 1, Cửa chính Tầng 1")}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-sky-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("settings.device.type_label", "Loại thiết bị / Cơ chế điều khiển")}
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {deviceTypes.map((item) => {
                const Icon = item.icon
                const isSelected = deviceType === item.type
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setDeviceType(item.type)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-sky-500 bg-sky-50/50 shadow-2xs dark:border-sky-500/80 dark:bg-sky-950/30"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isSelected ? "text-sky-600 dark:text-sky-400" : "text-slate-400"}`} />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.label}
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("settings.device.location_label", "Vị trí lắp đặt (Tùy chọn)")}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("settings.device.location_placeholder", "Ví dụ: Lối vào cửa số 2, Tầng 2 Khu VIP")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-sky-400"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t("common.cancel", "Hủy")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-sky-500 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              {submitting
                ? t("common.saving", "Đang lưu...")
                : t("settings.device.create_btn", "Thêm thiết bị")}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
