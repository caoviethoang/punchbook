import { AlertCircle, ChevronLeft, ChevronRight, Loader2, User } from "lucide-react"
import { useCheckInScreen } from "../hooks/useCheckInScreen"
import { getPaginationRange } from "../lib/memberships"
import { CheckInHeader } from "./checkin/CheckInHeader"
import { CheckInSearchInput } from "./checkin/CheckInSearchInput"
import { MembershipResultList } from "./checkin/CheckInSearchResults"
import { MembershipDetailModal } from "./MembershipDetailModal"
import { QRScannerModal } from "./QRScannerModal"
import { RenewalModal } from "./RenewalModal"
import { ThermalReceiptModal } from "./ThermalReceiptModal"
import type { Staff } from "../lib/auth"
import { Toast } from "./ui/Toast"

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
  } = useCheckInScreen({
    currentStaff,
    currentStaffId,
    shopName,
    shopAddress,
    shopPhone,
  })

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <CheckInHeader
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        currentStaff={currentStaff}
        staffs={staffs}
        selectedStaffId={selectedStaffId}
        onSelectStaff={setSelectedStaffId}
        loadingStaffs={loadingStaffs}
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
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-base font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Results Section */}
      {isLoading && memberships.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : !isLoading && memberships.length === 0 ? (
        query.trim() === "" ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <User className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Chưa có hội viên nào
            </h3>
            <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
              Cửa hàng hiện chưa có hội viên nào để điểm danh.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <User className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy hội viên phù hợp
            </h3>
            <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
              Không có kết quả nào cho từ khóa &ldquo;
              <span className="font-semibold text-slate-700 dark:text-slate-300">{query}</span>
              &rdquo;. Vui lòng kiểm tra lại thông tin.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {query.trim() === ""
                ? `Danh sách hội viên (${paginationMeta?.total ?? memberships.length})`
                : `Kết quả tìm kiếm cho "${query}" (${paginationMeta?.total ?? memberships.length})`}
            </h3>
            {isLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang tải...</span>
              </span>
            )}
          </div>

          <MembershipResultList
            memberships={memberships}
            checkingInId={checkingInId}
            checkInMessage={checkInMessage}
            onCheckIn={(id) => void handleCheckIn(id)}
            onRenew={(m) => setRenewingMembership(m)}
            onViewDetail={(id) => setDetailMembershipId(id)}
            onPrintReceipt={handlePrintReceipt}
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
        <RenewalModal membership={renewingMembership} onClose={() => setRenewingMembership(null)} />
      )}

      {/* Thermal Receipt Modal */}
      {selectedReceipt && (
        <ThermalReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />
    </div>
  )
}
