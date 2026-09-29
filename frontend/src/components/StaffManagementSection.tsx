import { useEffect, useState, type FormEvent } from "react"
import { Plus, Trash2, Users, UserCheck } from "lucide-react"
import type { Staff } from "../lib/auth"
import { toApiError } from "../lib/errors"
import { formatDate } from "../lib/formatters"
import { createStaff, deleteStaff, fetchStaffs } from "../lib/staffs"
import { FormField } from "./ui/FormField"

interface StaffManagementSectionProps {
  currentStaff?: Staff | null
  onToast: (message: string, type: "success" | "error") => void
}

export function StaffManagementSection({ currentStaff, onToast }: StaffManagementSectionProps) {
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "staff">("staff")
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = !currentStaff || currentStaff.role === "admin"

  const loadStaffs = async () => {
    if (!isAdmin) return
    try {
      setLoading(true)
      const list = await fetchStaffs()
      setStaffs(list)
    } catch (err) {
      onToast(toApiError(err, "Không thể tải danh sách nhân viên."), "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    let active = true
    fetchStaffs()
      .then((list) => {
        if (active) setStaffs(list)
      })
      .catch((err) => {
        if (active) onToast(toApiError(err, "Không thể tải danh sách nhân viên."), "error")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isAdmin, onToast])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await createStaff({ name, username, password, role })
      onToast(`Tạo tài khoản nhân viên ${name} thành công!`, "success")
      setName("")
      setUsername("")
      setPassword("")
      setRole("staff")
      setShowAddModal(false)
      loadStaffs()
    } catch (err) {
      onToast(toApiError(err, "Tạo nhân viên thất bại."), "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, staffName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản nhân viên "${staffName}"?`)) {
      return
    }

    try {
      await deleteStaff(id)
      onToast(`Đã xóa nhân viên ${staffName}.`, "success")
      loadStaffs()
    } catch (err) {
      onToast(toApiError(err, "Xóa nhân viên thất bại."), "error")
    }
  }

  if (!isAdmin) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Quản lý Nhân viên & Lễ tân
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tạo tài khoản đăng nhập riêng cho lễ tân và quản trị viên phòng tập.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-purple-500 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Nhân viên</span>
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Đang tải danh sách nhân viên...</div>
      ) : staffs.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">Chưa có tài khoản nhân viên nào.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="py-3 px-3">Tên nhân viên</th>
                <th className="py-3 px-3">Tên đăng nhập</th>
                <th className="py-3 px-3">Vai trò</th>
                <th className="py-3 px-3">Ngày tạo</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {staffs.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-slate-400" />
                      <span>{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {s.username || "—"}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        s.role === "admin"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300"
                      }`}
                    >
                      {s.role === "admin" ? "Quản trị viên (Admin)" : "Lễ tân (Staff)"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-500">
                    {s.created_at ? formatDate(s.created_at) : "—"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {s.id !== currentStaff?.id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id, s.name)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        title="Xóa nhân viên"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add Staff */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Thêm Nhân viên / Lễ tân
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tạo tài khoản làm việc cho lễ tân phòng tập.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <FormField
                label="Họ và tên nhân viên"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
              />
              <FormField
                label="Tên đăng nhập"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: letan_a"
              />
              <FormField
                label="Mật khẩu"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
              />
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Vai trò / Quyền hạn
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "staff")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="staff">Lễ tân (Thực hiện Check-in, quản lý hội viên)</option>
                  <option value="admin">Quản trị viên (Toàn quyền quản lý tiệm)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  {submitting ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
