import { useEffect, useState } from "react"
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Search,
  QrCode,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import {
  fetchMemberships,
  deleteMembership,
  type Membership,
  type MembershipPackage,
  type PaginationMeta,
  type StatusFilterType,
} from "../lib/memberships"
import { listPackages } from "../lib/packages"
import { type Shop } from "../lib/auth"
import { MemberQRModal } from "./MemberQRModal"
import { MemberEditModal } from "./MemberEditModal"
import { MembershipDetailModal } from "./MembershipDetailModal"
import { MembershipCreateForm } from "./MembershipCreateForm"
import { ImportMembersModal } from "./ImportMembersModal"

function MemberRemainingBadge({ membership }: { membership: Membership }) {
  if (membership.sessions_left !== null) {
    const isZero = membership.sessions_left === 0
    return (
      <span
        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
          isZero
            ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
        }`}
      >
        {membership.sessions_left} buổi còn lại
      </span>
    )
  }

  if (membership.expires_at) {
    const isExpired = new Date(membership.expires_at) < new Date()
    return (
      <span
        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
          isExpired
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
        }`}
      >
        {isExpired ? "Hết hạn" : `Hạn: ${membership.expires_at.substring(0, 10)}`}
      </span>
    )
  }

  return <span className="text-xs text-slate-400">Không giới hạn</span>
}

interface MembershipsScreenProps {
  shop: Shop
}

export function MembershipsScreen({ shop }: MembershipsScreenProps) {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatus] = useState<StatusFilterType>("all")
  const [page, setPage] = useState(1)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Membership | null>(null)
  const [qrMember, setQrMember] = useState<Membership | null>(null)
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null)
  const [deletingMember, setDeletingMember] = useState<Membership | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Load packages for dropdowns
  useEffect(() => {
    listPackages()
      .then(setPackages)
      .catch(() => {})
  }, [])

  // Load memberships on filter/page change
  useEffect(() => {
    let ignore = false

    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchMemberships({
          query: debouncedQuery,
          status,
          page,
          per_page: 15,
        })
        if (!ignore) {
          setMemberships(res.memberships)
          setMeta(res.meta || null)
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách hội viên.")
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      ignore = true
    }
  }, [debouncedQuery, status, page])

  const reloadData = () => {
    setPage((p) => p)
    setLoading(true)
    fetchMemberships({
      query: debouncedQuery,
      status,
      page,
      per_page: 15,
    })
      .then((res) => {
        setMemberships(res.memberships)
        setMeta(res.meta || null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không thể tải danh sách hội viên.")
      })
      .finally(() => setLoading(false))
  }

  const handleDelete = async () => {
    if (!deletingMember) return
    setDeleting(true)
    try {
      await deleteMembership(deletingMember.id)
      setDeletingMember(null)
      reloadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa hội viên thất bại.")
    } finally {
      setDeleting(false)
    }
  }

  const statusTabs: { key: StatusFilterType; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "active", label: "Đang hoạt động" },
    { key: "expiring", label: "Sắp hết hạn" },
    { key: "expired", label: "Đã hết hạn" },
  ]

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              Quản lý hội viên
            </h2>
            {meta && (
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                {meta.total} hội viên
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Danh sách, tạo mới, quét mã QR và quản lý thông tin hội viên
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Thêm hội viên</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc số điện thoại..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:bg-slate-950"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap rounded-xl border border-slate-200 p-1 dark:border-slate-800">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatus(tab.key)
                setPage(1)
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                status === tab.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Table / State */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="mt-3 text-sm font-medium">Đang tải danh sách hội viên...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => void reloadData()}
              className="mt-3 text-xs font-bold underline hover:text-red-700"
            >
              Thử lại
            </button>
          </div>
        ) : memberships.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center p-8 text-center text-slate-500">
            <Users className="h-12 w-12 text-slate-300 dark:text-slate-700" />
            <h4 className="mt-3 text-base font-bold text-slate-700 dark:text-slate-300">
              Không tìm thấy hội viên nào
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              {debouncedQuery || status !== "all"
                ? "Thử tìm kiếm với từ khóa hoặc bộ lọc khác."
                : "Nhấn nút 'Thêm hội viên' để bắt đầu đăng ký hội viên mới."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-bold">Hội viên</th>
                  <th className="px-5 py-4 font-bold">Gói dịch vụ</th>
                  <th className="px-5 py-4 font-bold">Mã QR</th>
                  <th className="px-5 py-4 font-bold">Buổi / Hạn dùng</th>
                  <th className="px-5 py-4 font-bold">Check-in hôm nay</th>
                  <th className="px-5 py-4 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {memberships.map((m) => (
                  <tr
                    key={m.id}
                    className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    {/* Customer Name & Phone */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-50">
                        {m.customer_name}
                      </div>
                      <div className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {m.phone}
                      </div>
                    </td>

                    {/* Package */}
                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {m.package.name}
                    </td>

                    {/* Member QR Code button */}
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setQrMember(m)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                      >
                        <QrCode className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Mã QR</span>
                      </button>
                    </td>

                    {/* Sessions left / Expiry */}
                    <td className="px-5 py-4">
                      <MemberRemainingBadge membership={m} />
                    </td>

                    {/* Today Check-in Badge */}
                    <td className="px-5 py-4">
                      {m.checked_in_today ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Đã điểm danh
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailMemberId(m.id)}
                          title="Xem chi tiết"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingMember(m)}
                          title="Chỉnh sửa"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingMember(m)}
                          title="Xóa hội viên"
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {meta && meta.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Trang {meta.page} / {meta.total_pages} (Tổng {meta.total} hội viên)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Trước</span>
              </button>

              <button
                type="button"
                disabled={page >= meta.total_pages}
                onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span>Sau</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals Integration */}
      {/* 1. Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg">
            <MembershipCreateForm
              shop={shop}
              onCancel={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false)
                void reloadData()
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Import Excel Modal */}
      <ImportMembersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => void reloadData()}
      />

      {/* 3. Member QR Modal */}
      {qrMember && (
        <MemberQRModal
          membership={qrMember}
          onClose={() => setQrMember(null)}
        />
      )}

      {/* 4. Member Edit Modal */}
      {editingMember && (
        <MemberEditModal
          membership={editingMember}
          packages={packages}
          onClose={() => setEditingMember(null)}
          onSuccess={() => void reloadData()}
        />
      )}

      {/* 5. Detail Modal */}
      {detailMemberId && (
        <MembershipDetailModal
          membershipId={detailMemberId}
          onClose={() => setDetailMemberId(null)}
        />
      )}

      {/* 6. Delete Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/60">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Xác nhận xóa hội viên</h3>
            </div>

            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn xóa hội viên{" "}
              <strong className="font-bold text-slate-900 dark:text-slate-50">
                {deletingMember.customer_name}
              </strong>{" "}
              ({deletingMember.phone})?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeletingMember(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Xóa hội viên</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
