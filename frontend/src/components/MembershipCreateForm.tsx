import React, { useEffect, useState } from "react"
import { createMembership, type Membership } from "../lib/memberships"
import { listPackages, type PackageItem } from "../lib/packages"

interface MembershipCreateFormProps {
  onSuccess?: (membership: Membership) => void
  onCancel?: () => void
}

function packageLabel(pkg: PackageItem): string {
  const detail = pkg.sessions_count
    ? `${pkg.sessions_count} buổi`
    : `${pkg.duration_days} ngày`
  return `${pkg.name} (${detail})`
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400"

export const MembershipCreateForm: React.FC<MembershipCreateFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [customerName, setCustomerName] = useState("")
  const [phone, setPhone] = useState("")
  const [packageId, setPackageId] = useState("")
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<Membership | null>(null)

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
        setError(err instanceof Error ? err.message : "Không tải được danh sách gói")
      })
      .finally(() => {
        if (!cancelled) setPackagesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setCreated(null)

    const name = customerName.trim()
    const phoneValue = phone.trim()
    if (!name) {
      setError("Vui lòng nhập tên hội viên")
      return
    }
    if (!phoneValue) {
      setError("Vui lòng nhập số điện thoại")
      return
    }
    if (!packageId) {
      setError("Vui lòng chọn gói dịch vụ")
      return
    }

    setLoading(true)
    try {
      const membership = await createMembership({
        customer_name: name,
        phone: phoneValue,
        package_id: packageId,
      })
      setCreated(membership)
      setCustomerName("")
      setPhone("")
      onSuccess?.(membership)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thêm hội viên thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Thêm hội viên
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Nhập tên, SĐT và chọn gói — sau đó có thể tìm ở màn Check-in
        </p>
      </div>

      {created && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                ✓ Thêm hội viên thành công!
              </p>
              <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-400">
                <strong>{created.customer_name}</strong> · {created.phone} ·{" "}
                {created.package.name}
                {created.sessions_left !== null
                  ? ` · ${created.sessions_left} buổi`
                  : created.expires_at
                    ? ` · hết hạn ${created.expires_at}`
                    : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreated(null)}
              className="text-xs text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Đóng
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
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Tên hội viên <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ví dụ: Hoa Nguyen"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Số điện thoại <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0902000000"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Gói dịch vụ <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            disabled={packagesLoading || packages.length === 0}
            className={inputClass}
          >
            <option value="">
              {packagesLoading
                ? "Đang tải gói..."
                : packages.length === 0
                  ? "Chưa có gói — tạo gói trước"
                  : "Chọn gói"}
            </option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {packageLabel(pkg)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy
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
                Đang thêm...
              </>
            ) : (
              "Thêm hội viên"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
