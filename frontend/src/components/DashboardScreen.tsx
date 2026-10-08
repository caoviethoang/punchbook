import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  CalendarClock,
  Loader2,
  Users,
  Wallet,
} from "lucide-react"
import type { Staff } from "../lib/auth"
import { AuditLogsPanel } from "./AuditLogsPanel"
import { useDashboard } from "../hooks/useDashboard"
import type { DashboardMembership } from "../lib/dashboard"
import { toApiError } from "../lib/errors"
import { formatVnd } from "../lib/formatters"
import {
  fetchMemberships,
  type PaginationMeta,
  type StatusFilterType,
} from "../lib/memberships"
import { downloadExcelReport } from "../lib/reports"
import { AnalyticsCharts } from "./AnalyticsCharts"
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
  const isAdmin = !currentStaff || currentStaff.role === "admin"
  const { data, loading, error, load } = useDashboard()
  const [selectedMembershipForRenewal, setSelectedMembershipForRenewal] =
    useState<DashboardMembership | null>(null)
  const [selectedMembershipIdForDetail, setSelectedMembershipIdForDetail] =
    useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false)

  // Pagination & Filtering state
  const [memberships, setMemberships] = useState<DashboardMembership[]>([])
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all")
  const [page, setPage] = useState(1)
  const [listLoading, setListLoading] = useState(false)

  useEffect(() => {
    void load().catch(() => {
      // Ignored
    })
  }, [load])

  useEffect(() => {
    let active = true
    fetchMemberships({
      query: searchQuery,
      status: statusFilter,
      page,
      per_page: 20,
    })
      .then((res) => {
        if (!active) return
        setMemberships(res.memberships as DashboardMembership[])
        if (res.meta) {
          setPaginationMeta(res.meta)
        }
      })
      .catch(() => {
        // Ignored
      })
      .finally(() => {
        if (active) {
          setListLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [searchQuery, statusFilter, page])

  const refreshList = useCallback(() => {
    setListLoading(true)
    fetchMemberships({
      query: searchQuery,
      status: statusFilter,
      page,
      per_page: 20,
    })
      .then((res) => {
        setMemberships(res.memberships as DashboardMembership[])
        if (res.meta) setPaginationMeta(res.meta)
      })
      .finally(() => setListLoading(false))
  }, [searchQuery, statusFilter, page])

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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="mx-4 rounded-xl bg-red-50 p-4 text-base font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300 sm:mx-6">
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

  if (!data) return null

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      {exportError && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{exportError}</span>
          </div>
        </div>
      )}

      {/* Header with quick action buttons */}
      <DashboardHeader
        isAdmin={isAdmin}
        exporting={exporting}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExport={() => void handleExport()}
      />

      {/* KPI Cards */}
      <div className={`grid gap-4 ${isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {isAdmin && (
          <MetricCard
            label="Doanh thu tháng"
            value={formatVnd(data.revenue_this_month)}
            icon={<Wallet className="h-4 w-4" />}
          />
        )}
        <MetricCard
          label="Hội viên active"
          value={String(data.active_memberships_count)}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          label="Sắp hết hạn (7 ngày)"
          value={String(data.expiring_within_7_days_count)}
          icon={<CalendarClock className="h-4 w-4" />}
        />
      </div>

      {/* Analytics Charts (30-day Revenue & 24h Check-in Frequency) */}
      <AnalyticsCharts
        dailyRevenue={data.daily_revenue_30_days}
        checkInFrequency={data.check_in_frequency_by_hour}
        peakHour={data.peak_check_in_hour}
      />

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

      {isAuditLogsOpen && (
        <AuditLogsPanel
          shopId=""
          onClose={() => setIsAuditLogsOpen(false)}
        />
      )}
    </div>
  )
}
