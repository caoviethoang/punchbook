import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CalendarClock, Loader2, Users, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Staff } from "../lib/auth"
import { AuditLogsPanel } from "./AuditLogsPanel"
import { useDashboard } from "../hooks/useDashboard"
import { usePaginatedMemberships } from "../hooks/usePaginatedMemberships"
import type { DashboardMembership, MembershipStatus } from "../lib/dashboard"
import { toApiError } from "../lib/errors"
import { formatVnd } from "../lib/formatters"
import { computeMembershipStatus } from "../lib/memberships"
import { downloadExcelReport } from "../lib/reports"
import { AnalyticsCharts } from "./AnalyticsCharts"
import { AttendanceReportSection } from "./dashboard/AttendanceReportSection"
import RetentionRiskWidget from "./dashboard/RetentionRiskWidget"
import { TrainerCommissionReportSection } from "./dashboard/TrainerCommissionReportSection"
import { DashboardHeader } from "./dashboard/DashboardHeader"
import { DashboardMembershipsTable } from "./dashboard/DashboardMembershipsTable"
import { MetricCard } from "./dashboard/MetricCard"
import { ImportMembersModal } from "./ImportMembersModal"
import { MembershipDetailModal } from "./MembershipDetailModal"
import { RenewalModal } from "./RenewalModal"

interface DashboardScreenProps {
  currentStaff?: Staff | null
}

export function DashboardScreen({ currentStaff }: DashboardScreenProps) {
  const { t } = useTranslation()
  const isAdmin = !currentStaff || currentStaff.role === "admin"
  const isTrainer = currentStaff?.role === "trainer"
  const { data, loading, error, load } = useDashboard()
  const [selectedMembershipForRenewal, setSelectedMembershipForRenewal] =
    useState<DashboardMembership | null>(null)
  const [selectedMembershipIdForDetail, setSelectedMembershipIdForDetail] = useState<string | null>(
    null,
  )
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false)
  const [reportTab, setReportTab] = useState<"attendance" | "trainer_commissions">("attendance")

  // Shared Pagination & Filtering hook with debouncing and safe typing
  const {
    memberships: rawMemberships,
    meta: paginationMeta,
    query: searchQuery,
    setQuery: setSearchQuery,
    status: statusFilter,
    setStatus: setStatusFilter,
    page,
    setPage,
    loading: listLoading,
    reloadData: refreshList,
  } = usePaginatedMemberships()

  const memberships: DashboardMembership[] = useMemo(
    () =>
      rawMemberships.map((m) => ({
        ...m,
        status: (m.status as MembershipStatus) ?? computeMembershipStatus(m),
      })),
    [rawMemberships],
  )

  useEffect(() => {
    if (!isAdmin) return
    load().catch(() => {
      // Ignored
    })
  }, [isAdmin, load])

  const handleExport = async () => {
    try {
      setExporting(true)
      setExportError(null)
      await downloadExcelReport()
    } catch (err) {
      setExportError(toApiError(err, "Xuất báo cáo thất bại."))
    } finally {
      setExporting(false)
    }
  }

  if (isAdmin && loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    )
  }

  if (isAdmin && error && !data) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-base font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200"
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (isAdmin && !data) return null
  if (!isAdmin && !isTrainer && !data) return null

  return (
    <div className="space-y-6">
      {exportError && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{exportError}</span>
          </div>
        </div>
      )}

      {isAdmin && data ? (
        <>
          {/* Header with quick action buttons */}
          <DashboardHeader
            isAdmin={isAdmin}
            exporting={exporting}
            onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onExport={() => void handleExport()}
          />

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label={t("dashboard.revenue_this_month", "Doanh thu tháng")}
              value={formatVnd(data.revenue_this_month)}
              icon={<Wallet className="h-4 w-4" />}
            />
            <MetricCard
              label={t("dashboard.active_members", "Hội viên active")}
              value={String(data.active_memberships_count)}
              icon={<Users className="h-4 w-4" />}
              active={statusFilter === "active"}
              onClick={() => {
                setStatusFilter((prev) => (prev === "active" ? "all" : "active"))
                setPage(1)
              }}
            />
            <MetricCard
              label={t("dashboard.expiring_soon", "Sắp hết hạn (<= 3 buổi / 7 ngày)")}
              value={String(data.expiring_within_7_days_count)}
              icon={<CalendarClock className="h-4 w-4" />}
              active={statusFilter === "expiring"}
              onClick={() => {
                setStatusFilter((prev) => (prev === "expiring" ? "all" : "expiring"))
                setPage(1)
              }}
            />
          </div>
        </>
      ) : isTrainer ? (
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("trainer_commissions.welcome_title", "Bảng điều khiển Huấn luyện viên (PT)")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t(
              "trainer_commissions.welcome_subtitle",
              "Theo dõi học viên được phân công, số buổi còn lại và tổng hợp hoa hồng hàng tháng.",
            )}
          </p>
        </div>
      ) : null}

      {/* Analytics Charts (30-day Revenue, Package Revenue & 24h Check-in Frequency) */}
      {isAdmin && data ? (
        <>
          <AnalyticsCharts
            dailyRevenue={data.daily_revenue_30_days}
            checkInFrequency={data.check_in_frequency_by_hour}
            peakHour={data.peak_check_in_hour}
            packageRevenue={data.revenue_by_package}
          />

          <RetentionRiskWidget onSelectDetail={setSelectedMembershipIdForDetail} />

          <div className="space-y-3">
            <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setReportTab("attendance")}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  reportTab === "attendance"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                {t("reports.tab_attendance", "Báo cáo Chuyên cần")}
              </button>
              <button
                type="button"
                onClick={() => setReportTab("trainer_commissions")}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  reportTab === "trainer_commissions"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                {t("reports.tab_trainer_commissions", "Hoa hồng PT & Payroll")}
              </button>
            </div>

            {reportTab === "attendance" ? (
              <AttendanceReportSection onSelectDetail={setSelectedMembershipIdForDetail} />
            ) : (
              <TrainerCommissionReportSection
                currentStaff={currentStaff}
                onSelectDetail={setSelectedMembershipIdForDetail}
              />
            )}
          </div>
        </>
      ) : currentStaff?.role === "trainer" ? (
        <TrainerCommissionReportSection
          currentStaff={currentStaff}
          onSelectDetail={setSelectedMembershipIdForDetail}
        />
      ) : null}

      {/* Memberships Table with search & pagination */}
      <DashboardMembershipsTable
        memberships={memberships}
        paginationMeta={paginationMeta}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q)
          setPage(1)
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s)
          setPage(1)
        }}
        page={page}
        onPageChange={setPage}
        listLoading={listLoading}
        onSelectDetail={setSelectedMembershipIdForDetail}
        onSelectRenewal={setSelectedMembershipForRenewal}
      />

      {/* Modals */}
      {selectedMembershipIdForDetail && (
        <MembershipDetailModal
          membershipId={selectedMembershipIdForDetail}
          onClose={() => setSelectedMembershipIdForDetail(null)}
        />
      )}

      {selectedMembershipForRenewal && (
        <RenewalModal
          membership={selectedMembershipForRenewal}
          onClose={() => {
            setSelectedMembershipForRenewal(null)
            refreshList()
          }}
        />
      )}

      <ImportMembersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          void load()
          refreshList()
        }}
      />

      {isAuditLogsOpen && <AuditLogsPanel shopId="" onClose={() => setIsAuditLogsOpen(false)} />}
    </div>
  )
}
