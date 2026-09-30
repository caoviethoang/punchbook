import { useState } from "react"
import { X, UserCheck, Loader2 } from "lucide-react"
import { updateMembership, type Membership, type MembershipPackage } from "../lib/memberships"

interface MemberEditModalProps {
  membership: Membership | null
  packages: MembershipPackage[]
  onClose: () => void
  onSuccess: (updated: Membership) => void
}

export function MemberEditModal({
  membership,
  packages,
  onClose,
  onSuccess,
}: MemberEditModalProps) {
  const [customerName, setCustomerName] = useState(membership?.customer_name || "")
  const [phone, setPhone] = useState(membership?.phone || "")
  const [packageId, setPackageId] = useState(membership?.package?.id || "")
  const [sessionsLeft, setSessionsLeft] = useState<string>(
    membership?.sessions_left !== null && membership?.sessions_left !== undefined
      ? String(membership.sessions_left)
      : "",
  )
  const [expiresAt, setExpiresAt] = useState<string>(
    membership?.expires_at ? membership.expires_at.substring(0, 10) : "",
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!membership) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim() || !phone.trim()) {
      setError("Vui lòng nhập tên và số điện thoại.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const updated = await updateMembership(membership!.id, {
        customer_name: customerName.trim(),
        phone: phone.trim(),
        package_id: packageId || undefined,
        sessions_left: sessionsLeft !== "" ? Number(sessionsLeft) : null,
        expires_at: expiresAt !== "" ? expiresAt : null,
      })
      onSuccess(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Đóng</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Chỉnh sửa hội viên
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cập nhật thông tin hội viên và gói cước
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tên hội viên *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số điện thoại *
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Gói dịch vụ
            </label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="">Giữ nguyên ({membership.package.name})</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Số buổi còn lại
              </label>
              <input
                type="number"
                min="0"
                value={sessionsLeft}
                onChange={(e) => setSessionsLeft(e.target.value)}
                placeholder="Không giới hạn"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hạn sử dụng
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
