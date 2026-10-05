import type { FormEvent } from "react"
import { KeyRound } from "lucide-react"
import { FormField } from "../ui/FormField"

interface SecuritySectionProps {
  isAdmin: boolean
  currentPassword: string
  setCurrentPassword: (v: string) => void
  newPassword: string
  setNewPassword: (v: string) => void
  confirmPassword: string
  setConfirmPassword: (v: string) => void
  passwordLoading: boolean
  onSubmit: (e: FormEvent) => void
}

export function SecuritySection({
  isAdmin,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordLoading,
  onSubmit,
}: SecuritySectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Đổi mật khẩu
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bảo vệ tài khoản với mật khẩu mới.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="Mật khẩu hiện tại"
          type="password"
          required
          disabled={!isAdmin}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
        />
        <FormField
          label="Mật khẩu mới"
          type="password"
          required
          disabled={!isAdmin}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mật khẩu tối thiểu 6 ký tự"
        />
        <FormField
          label="Xác nhận mật khẩu mới"
          type="password"
          required
          disabled={!isAdmin}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu mới"
        />

        <div className="pt-2">
          <button
            type="submit"
            disabled={passwordLoading || !isAdmin}
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isAdmin
              ? "Chỉ xem (Không có quyền sửa)"
              : passwordLoading
              ? "Đang xử lý..."
              : "Cập nhật mật khẩu"}
          </button>
        </div>
      </form>
    </section>
  )
}
