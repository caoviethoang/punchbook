import { AlertCircle, ChevronLeft, ChevronRight, Loader2, User, UserCheck, Users } from "lucide-react"
import { useCheckInScreen } from "../hooks/useCheckInScreen"
import { getPaginationRange, type CheckInFilterType } from "../lib/memberships"
import { CheckInHeader } from "./checkin/CheckInHeader"
import { CheckInSearchInput } from "./checkin/CheckInSearchInput"
import { MembershipResultList } from "./checkin/CheckInSearchResults"
import { GroupCheckInResultModal } from "./checkin/GroupCheckInResultModal"
import { MembershipDetailModal } from "./MembershipDetailModal"
import { QRScannerModal } from "./QRScannerModal"
import { RenewalModal } from "./RenewalModal"
import { ThermalReceiptModal } from "./ThermalReceiptModal"
import type { Staff } from "../lib/auth"
import { Toast } from "./ui/Toast"
import { cn } from "../lib/utils"

const CHECKIN_FILTER_TABS: { key: CheckInFilterType; label: string }[] = [
  { key: "not_checked_in", label: "Chưa CI" },
  { key: "expiring", label: "Sắp hết vé" },
  { key: "expired", label: "Đã hết vé" },
  { key: "all", label: "Tất cả" },
]

interface CheckInScreenProps {
  /** Optional active staff object. */
  currentStaff?: Staff | null
  /** Optional staff ID to perform check-ins. */
  currentStaffId?: string
  shopName?: string
  shopAddress?: string | null
  shopPhone?: string | null
}

export function CheckInScreen({
  currentStaff,
  currentStaffId,
  shopName = "PunchBook Spa",
  shopAddress,
  shopPhone,
}: CheckInScreenProps) {
  const {
    query,
    setQuery,
    filter,
    setFilter,
    memberships,
    page,
    setPage,
    paginationMeta,
    checkingInId,
    checkInMessage,
    toast,
    setToast,
    isQRScannerOpen,
    setIsQRScannerOpen,
    selectedReceipt,
    setSelectedReceipt,
    inputRef,
    detailMembershipId,
    setDetailMembershipId,
    renewingMembership,
    setRenewingMembership,
    isLoading,
    apiError,
    handleClear,
    handleKeyDown,
    handleCheckIn,
    handleQRScan,
    handlePrintReceipt,
    staffs,
    loadingStaffs,
    selectedStaffId,
    setSelectedStaffId,
    refreshMemberships,
    isGroupMode,
    toggleGroupMode,
    selectedIds,
    toggleSelectMember,
    selectAllEligible,
    clearSelection,
    isBatchCheckingIn,
    handleBatchCheckIn,
    batchResult,
    isBatchResultModalOpen,
    setIsBatchResultModalOpen,
  } = useCheckInScreen({
    currentStaff,
    currentStaffId,
    shopName,
    shopAddress,
    shopPhone,
  })

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <CheckInHeader
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        currentStaff={currentStaff}
        staffs={staffs}
        selectedStaffId={selectedStaffId}
        onSelectStaff={setSelectedStaffId}
        loadingStaffs={loadingStaffs}
        isGroupMode={isGroupMode}
        onToggleGroupMode={toggleGroupMode}
      />

      {/* Search Input Box */}
      <CheckInSearchInput
        inputRef={inputRef}
        query={query}
        onQueryChange={setQuery}
        onKeyDown={handleKeyDown}
        onClear={handleClear}
        isLoading={isLoading}
      />

      {/* API Error Alert */}
      {apiError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Header bar with Title, Filter Tabs, and Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">
              {query.trim() ? "Kết quả tìm kiếm" : "Danh sách hội viên"}
            </h2>
            {isLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang tải...</span>
              </span>
            )}
          </div>

          {/* Filter Tabs: Chưa CI, Sắp hết vé, Đã hết vé, Tất cả */}
          <div
            role="tablist"
            aria-label="Lọc trạng thái hội viên"
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900/60"
          >
            {CHECKIN_FILTER_TABS.map((tab) => {
              const isActive = filter === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            query.trim()
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
          )}
        >
          {paginationMeta?.total ?? memberships.length} {query.trim() ? "kết quả" : "hội viên"}
        </span>
      </div>

      {/* Results Content */}
      {isLoading && memberships.length === 0 ? (
        <div
          role="status"
          aria-label="Đang tải danh sách hội viên"
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 sm:text-lg">
            Đang tải danh sách hội viên...
          </h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      ) : memberships.length === 0 ? (
        query.trim() === "" ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 sm:text-lg">
              {filter === "not_checked_in"
                ? "Tất cả hội viên đã check-in hôm nay"
                : filter === "expiring"
                  ? "Không có hội viên nào sắp hết vé"
                  : filter === "expired"
                    ? "Không có hội viên nào đã hết vé"
                    : "Chưa có hội viên nào trong hệ thống"}
            </h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {filter === "not_checked_in"
                ? "Không còn hội viên nào đang chờ check-in trong ca trực."
                : filter === "expiring"
                  ? "Hiện tại không có hội viên nào sắp hết hạn hoặc còn ít buổi."
                  : filter === "expired"
                    ? "Hiện tại không có hội viên nào hết hạn thẻ hoặc hết số buổi."
                    : "Các hội viên đăng ký gói tập sẽ xuất hiện tại đây để điểm danh nhanh."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <User className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 sm:text-lg">
              Không tìm thấy hội viên phù hợp
            </h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Không có kết quả nào cho từ khóa &ldquo;
              <span className="font-semibold text-slate-700 dark:text-slate-300">{query}</span>
              &rdquo;. Vui lòng kiểm tra lại thông tin.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          <MembershipResultList
            memberships={memberships}
            checkingInId={checkingInId}
            checkInMessage={checkInMessage}
            onCheckIn={(id) => void handleCheckIn(id)}
            onRenew={(m) => setRenewingMembership(m)}
            onViewDetail={(id) => setDetailMembershipId(id)}
            onPrintReceipt={handlePrintReceipt}
            isGroupMode={isGroupMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectMember}
          />

          {paginationMeta && paginationMeta.total_pages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 py-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Hiển thị trang {paginationMeta.page} / {paginationMeta.total_pages} (Tổng {paginationMeta.total} hội viên)
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage(page - 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Trang trước</span>
                </button>

                <div className="flex items-center gap-1">
                  {getPaginationRange(paginationMeta.page, paginationMeta.total_pages).map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1 text-xs text-slate-400 select-none"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        disabled={isLoading}
                        onClick={() => setPage(item)}
                        aria-label={`Trang ${item}`}
                        aria-current={item === page ? "page" : undefined}
                        className={`min-w-[32px] rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                          item === page
                            ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  disabled={page >= paginationMeta.total_pages || isLoading}
                  onClick={() => setPage(page + 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Trang sau"
                >
                  <span className="hidden sm:inline">Trang sau</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Membership Detail & History Modal */}
      {detailMembershipId && (
        <MembershipDetailModal
          membershipId={detailMembershipId}
          onClose={() => setDetailMembershipId(null)}
        />
      )}

      {/* Renewal Modal */}
      {renewingMembership && (
        <RenewalModal
          membership={renewingMembership}
          onClose={() => {
            setRenewingMembership(null)
            void refreshMemberships()
          }}
        />
      )}

      {/* Thermal Receipt Modal */}
      {selectedReceipt && (
        <ThermalReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}

      {/* Sticky Group Check-in Action Bar */}
      {isGroupMode && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-white/95 p-3.5 shadow-lg backdrop-blur-md dark:border-indigo-900/60 dark:bg-slate-900/95 sm:px-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 sm:text-sm">
              Đã chọn {selectedIds.size} hội viên
            </span>
            <div className="flex items-center gap-1.5 pl-2">
              <button
                type="button"
                onClick={selectAllEligible}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
              >
                Chọn tất cả
              </button>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Bỏ chọn
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedIds.size === 0 || isBatchCheckingIn}
              onClick={() => void handleBatchCheckIn()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none sm:text-sm"
            >
              {isBatchCheckingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang check-in...</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Điểm danh nhóm ({selectedIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Group Check-In Result Summary Modal */}
      <GroupCheckInResultModal
        isOpen={isBatchResultModalOpen}
        result={batchResult}
        onClose={() => setIsBatchResultModalOpen(false)}
        onPrintReceipt={handlePrintReceipt}
      />

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />
    </div>
  )
}
