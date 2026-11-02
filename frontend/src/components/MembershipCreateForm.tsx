import { useEffect, useState } from "react"
import { FileSpreadsheet, QrCode } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Shop } from "../lib/auth"
import { createMembership, type Membership } from "../lib/memberships"
import { listPackages, type PackageItem } from "../lib/packages"
import { ImportMembersModal } from "./ImportMembersModal"
import { MembershipPaymentQRModal } from "./MembershipPaymentQRModal"
import { FormField, FORM_CONTROL_CLASS } from "./ui/FormField"

interface MembershipCreateFormProps {
  shop?: Shop | null
  onSuccess?: (membership: Membership) => void
  onCancel?: () => void
}

export function MembershipCreateForm({ shop, onSuccess, onCancel }: MembershipCreateFormProps) {
  const { t } = useTranslation()
  const [customerName, setCustomerName] = useState("")
  const [phone, setPhone] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [packageId, setPackageId] = useState("")
  const [notes, setNotes] = useState("")
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<Membership | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)

  function packageLabel(pkg: PackageItem): string {
    const detail = pkg.sessions_count
      ? t("common.sessions_count", `${pkg.sessions_count} buổi`, { count: pkg.sessions_count })
      : t("common.days_count", `${pkg.duration_days} ngày`, { count: pkg.duration_days ?? 0 })
    return `${pkg.name} (${detail})`
  }

  useEffect(() => {
    let cancelled = false

    listPackages()
      .then((items) => {
        if (cancelled) return
        setPackages(items)
        if (items.length === 1) {
          setPackageId(items[0].id)
        }
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : t("memberships.load_packages_failed", "Không tải được danh sách gói"))
      })
      .finally(() => {
        if (!cancelled) setPackagesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [t])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setCreated(null)

    const name = customerName.trim()
    const phoneValue = phone.trim()
    if (!name) {
      setError(t("memberships.error_name_required", "Vui lòng nhập tên hội viên"))
      return
    }
    if (!phoneValue) {
      setError(t("memberships.error_phone_required", "Vui lòng nhập số điện thoại"))
      return
    }
    if (!packageId) {
      setError(t("memberships.error_package_required", "Vui lòng chọn gói dịch vụ"))
      return
    }

    setLoading(true)
    try {
      const membership = await createMembership({
        customer_name: name,
        phone: phoneValue,
        package_id: packageId,
        card_number: cardNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      setCreated(membership)
      setIsQrModalOpen(true)
      setCustomerName("")
      setPhone("")
      setCardNumber("")
      setNotes("")
      onSuccess?.(membership)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("memberships.create_failed", "Thêm hội viên thất bại"))
    } finally {
      setLoading(false)
    }
  }

  const selectedPackage = packages.find((p) => p.id === packageId)

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t("memberships.create_title", "Thêm hội viên")}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("memberships.create_subtitle", "Nhập tên, SĐT và chọn gói — sau đó có thể tìm ở màn Check-in")}
        </p>
      </div>

      {created && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                {t("memberships.create_success", "✓ Thêm hội viên thành công!")}
              </p>
              <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-400">
                <strong>{created.customer_name}</strong> · {created.phone} · {created.package.name}
                {created.sessions_left !== null
                  ? ` · ${t("common.sessions_count", `${created.sessions_left} buổi`, { count: created.sessions_left })}`
                  : created.expires_at
                    ? ` · ${t("memberships.expires_at_label", `hết hạn ${created.expires_at}`, { date: created.expires_at })}`
                    : ""}
              </p>

              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>{t("memberships.view_transfer_qr", "Xem mã QR Chuyển khoản")}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCreated(null)}
              className="text-xs text-emerald-700 hover:underline dark:text-emerald-400"
            >
              {t("common.close", "Đóng")}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label={t("memberships.customer_name_label", "Tên hội viên")}
          required
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder={t("memberships.customer_name_placeholder", "Ví dụ: Hoa Nguyen")}
        />

        <FormField
          label={t("memberships.phone_label", "Số điện thoại")}
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0902000000"
        />

        <FormField
          label={t("memberships.card_uid_label", "Mã thẻ từ / RFID / Mã định danh thiết bị (tùy chọn)")}
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder={t("memberships.card_uid_placeholder", "Ví dụ: RFID_123456 hoặc quẹt thẻ vào đây")}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("memberships.package_label", "Gói dịch vụ")} <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            disabled={packagesLoading || packages.length === 0}
            className={FORM_CONTROL_CLASS}
          >
            <option value="">
              {packagesLoading
                ? t("memberships.loading_packages", "Đang tải gói...")
                : packages.length === 0
                  ? t("memberships.empty_packages_create_first", "Chưa có gói — tạo gói trước")
                  : t("memberships.select_package_placeholder", "Chọn gói")}
            </option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {packageLabel(pkg)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t("memberships.internal_notes_label", "Ghi chú nội bộ (tùy chọn)")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t("memberships.internal_notes_placeholder", "Dị ứng, sở thích, yêu cầu đặc biệt...")}
            className={FORM_CONTROL_CLASS}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t("memberships.import_excel_csv", "Import từ Excel / CSV")}</span>
          </button>

          <div className="flex items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t("common.cancel", "Hủy")}
              </button>
            )}
            <button
              type="submit"
              disabled={loading || packagesLoading || packages.length === 0}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("memberships.adding_btn", "Đang thêm...")}
                </>
              ) : (
                t("memberships.create_title", "Thêm hội viên")
              )}
            </button>
          </div>
        </div>
      </form>

      <ImportMembersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          if (onSuccess && created) {
            onSuccess(created)
          }
        }}
      />

      <MembershipPaymentQRModal
        isOpen={isQrModalOpen}
        membership={created}
        packagePrice={created?.package?.price ?? selectedPackage?.price}
        shop={shop}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  )
}
