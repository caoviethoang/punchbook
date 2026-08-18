import { useState } from "react"
import { createPackage, type PackageItem, type PackageType } from "../lib/packages"
import { FormField } from "./ui/FormField"

interface PackageCreateFormProps {
  onSuccess?: (pkg: PackageItem) => void
  onCancel?: () => void
}

const typeButtonClass = (active: boolean) =>
  `flex items-center justify-center rounded-xl border py-2.5 px-4 text-sm font-semibold transition ${
    active
      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300"
      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60"
  }`

export function PackageCreateForm({ onSuccess, onCancel }: PackageCreateFormProps) {
  const [name, setName] = useState("")
  const [packageType, setPackageType] = useState<PackageType>("sessions")
  const [sessionsCount, setSessionsCount] = useState<string>("10")
  const [durationDays, setDurationDays] = useState<string>("30")
  const [price, setPrice] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPackage, setCreatedPackage] = useState<PackageItem | null>(null)

  function formatVnd(val: string) {
    const num = parseInt(val.replace(/\D/g, ""), 10)
    if (isNaN(num)) return ""
    return new Intl.NumberFormat("vi-VN").format(num)
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPrice(e.target.value.replace(/\D/g, ""))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCreatedPackage(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Vui lòng nhập tên gói")
      return
    }

    const parsedPrice = parseInt(price, 10)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Vui lòng nhập giá hợp lệ (≥ 0 VNĐ)")
      return
    }

    let payloadSessions: number | undefined
    let payloadDays: number | undefined

    if (packageType === "sessions") {
      const parsedSessions = parseInt(sessionsCount, 10)
      if (isNaN(parsedSessions) || parsedSessions <= 0) {
        setError("Vui lòng nhập số buổi hợp lệ (> 0)")
        return
      }
      payloadSessions = parsedSessions
    } else {
      const parsedDays = parseInt(durationDays, 10)
      if (isNaN(parsedDays) || parsedDays <= 0) {
        setError("Vui lòng nhập số ngày hợp lệ (> 0)")
        return
      }
      payloadDays = parsedDays
    }

    setLoading(true)

    try {
      const pkg = await createPackage({
        name: trimmedName,
        price: parsedPrice,
        sessions_count: payloadSessions,
        duration_days: payloadDays,
      })

      setCreatedPackage(pkg)
      setName("")
      setPrice("")
      onSuccess?.(pkg)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo gói thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Tạo gói dịch vụ mới
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Điền thông tin để tạo gói tập / lượt dịch vụ cho cửa hàng
          </p>
        </div>
      </div>

      {createdPackage && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                ✓ Tạo gói thành công!
              </p>
              <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-400">
                <strong>{createdPackage.name}</strong> —{" "}
                {new Intl.NumberFormat("vi-VN").format(createdPackage.price)} VNĐ (
                {createdPackage.sessions_count
                  ? `${createdPackage.sessions_count} buổi`
                  : `${createdPackage.duration_days} ngày`}
                )
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreatedPackage(null)}
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
        <FormField
          label="Tên gói"
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Gói 10 buổi Yoga, Thẻ tháng 30 ngày..."
        />

        {/* Loại gói (theo buổi / theo ngày) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Loại gói <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPackageType("sessions")}
              className={typeButtonClass(packageType === "sessions")}
            >
              Theo buổi
            </button>
            <button
              type="button"
              onClick={() => setPackageType("days")}
              className={typeButtonClass(packageType === "days")}
            >
              Theo ngày
            </button>
          </div>
        </div>

        {packageType === "sessions" ? (
          <FormField
            label="Số buổi"
            required
            type="number"
            min="1"
            value={sessionsCount}
            onChange={(e) => setSessionsCount(e.target.value)}
            placeholder="10"
          />
        ) : (
          <FormField
            label="Số ngày"
            required
            type="number"
            min="1"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="30"
          />
        )}

        {/* Giá (VNĐ) — custom input with suffix, cannot use FormField directly */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Giá (VNĐ) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={price ? formatVnd(price) : ""}
              onChange={handlePriceChange}
              placeholder="500.000"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-14 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400"
            />
            <span className="pointer-events-none absolute right-3.5 top-2.5 text-sm font-medium text-slate-400">
              VNĐ
            </span>
          </div>
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
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang tạo...
              </>
            ) : (
              "Tạo gói"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
