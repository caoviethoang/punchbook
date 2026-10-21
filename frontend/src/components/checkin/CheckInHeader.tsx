import { QrCode, UserCheck } from "lucide-react"
import type { Staff } from "../../lib/auth"
import { formatStaffOptionLabel } from "../../lib/staffs"

interface CheckInHeaderProps {
  onOpenQRScanner: () => void
  currentStaff?: Staff | null
  staffs?: Staff[]
  selectedStaffId?: string | null
  onSelectStaff?: (staffId: string) => void
  loadingStaffs?: boolean
}

export function CheckInHeader({
  onOpenQRScanner,
  currentStaff,
  staffs = [],
  selectedStaffId,
  onSelectStaff,
  loadingStaffs = false,
}: CheckInHeaderProps) {
  const isNonAdminStaff = Boolean(currentStaff && currentStaff.role !== "admin")

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
            <UserCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Check-in Hội Viên
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Tìm kiếm theo tên hoặc số điện thoại để điểm danh hội viên
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenQRScanner}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 dark:shadow-none sm:text-sm"
        >
          <QrCode className="h-4 w-4" />
          <span>Quét mã QR</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:px-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <UserCheck className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:text-xs">
            Nhân viên trực ca:
          </span>
        </div>

        {isNonAdminStaff ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {currentStaff?.name}
            </span>
            <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Lễ tân
            </span>
          </div>
        ) : (
          <OnDutyStaffSelector
            currentStaff={currentStaff}
            staffs={staffs}
            selectedStaffId={selectedStaffId}
            onSelectStaff={onSelectStaff}
            loadingStaffs={loadingStaffs}
          />
        )}
      </div>
    </div>
  )
}

interface OnDutyStaffSelectorProps {
  currentStaff?: Staff | null
  staffs: Staff[]
  selectedStaffId?: string | null
  onSelectStaff?: (staffId: string) => void
  loadingStaffs: boolean
}

function OnDutyStaffSelector({
  currentStaff,
  staffs,
  selectedStaffId,
  onSelectStaff,
  loadingStaffs,
}: OnDutyStaffSelectorProps) {
  if (loadingStaffs) {
    return <span className="text-xs text-slate-400">Đang tải nhân viên...</span>
  }

  if (staffs.length > 0 && onSelectStaff) {
    const hasCurrentStaffInList = Boolean(
      currentStaff && staffs.some((s) => s.id === currentStaff.id),
    )
    const effectiveValue =
      selectedStaffId ||
      (currentStaff?.id && hasCurrentStaffInList ? currentStaff.id : "") ||
      (hasCurrentStaffInList && staffs[0] ? staffs[0].id : "")

    return (
      <select
        id="checkin-staff-select"
        aria-label="Chọn nhân viên trực ca"
        value={effectiveValue}
        onChange={(e) => onSelectStaff(e.target.value)}
        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-900"
      >
        {!hasCurrentStaffInList && (
          <option value="">
            {currentStaff ? formatStaffOptionLabel(currentStaff) : "Mặc định (Admin)"}
          </option>
        )}
        {staffs.map((s) => (
          <option key={s.id} value={s.id}>
            {formatStaffOptionLabel(s)}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {currentStaff?.name || "Admin (Chủ tiệm)"}
      </span>
      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
        Admin
      </span>
    </div>
  )
}
