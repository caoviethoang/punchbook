import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { type Shop, type Staff } from "../lib/auth"
import { toApiError } from "../lib/errors"
import { exportMemberships } from "../lib/memberships"
import { useMembershipsQuery } from "../hooks/useMembershipsQuery"

import { DeleteMemberModal } from "./memberships/DeleteMemberModal"
import { MembershipFilterBar } from "./memberships/MembershipFilterBar"
import { MembershipHeader } from "./memberships/MembershipHeader"
import { MembershipTable } from "./memberships/MembershipTable"

import { ImportMembersModal } from "./ImportMembersModal"
import { MembershipCreateForm } from "./MembershipCreateForm"
import { MembershipDetailModal } from "./MembershipDetailModal"
import { MemberEditModal } from "./MemberEditModal"
import { MemberQRModal } from "./MemberQRModal"

interface MembershipsScreenProps {
  shop: Shop
  currentStaff?: Staff | null
}

export function MembershipsScreen({ shop, currentStaff }: MembershipsScreenProps) {
  const isAdmin = !currentStaff || currentStaff.role === "admin"
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const {
    memberships,
    meta,
    packages,
    query,
    setQuery,
    debouncedQuery,
    status,
    setStatus,
    page,
    setPage,
    loading,
    error,
    showCreateModal,
    setShowCreateModal,
    showImportModal,
    setShowImportModal,
    editingMember,
    setEditingMember,
    qrMember,
    setQrMember,
    detailMemberId,
    setDetailMemberId,
    deletingMember,
    setDeletingMember,
    deleting,
    reloadData,
    handleDelete,
    restoringMemberId,
    handleRestore,
  } = useMembershipsQuery()

  const handleExport = async () => {
    try {
      setExporting(true)
      setExportError(null)
      await exportMemberships({
        query: debouncedQuery.trim() || undefined,
        status,
      })
    } catch (err) {
      setExportError(toApiError(err, "Xuất danh sách hội viên thất bại."))
    } finally {
      setExporting(false)
    }
  }

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

      {/* Top Action Header */}
      <MembershipHeader
        meta={meta}
        isAdmin={isAdmin}
        exporting={exporting}
        onExport={() => void handleExport()}
        onOpenImportModal={() => setShowImportModal(true)}
        onOpenCreateModal={() => setShowCreateModal(true)}
      />

      {/* Filter & Search Bar */}
      <MembershipFilterBar
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={(s) => {
          setStatus(s)
          setPage(1)
        }}
        isAdmin={isAdmin}
      />

      {/* Content Table / State */}
      <MembershipTable
        loading={loading}
        error={error}
        memberships={memberships}
        meta={meta}
        page={page}
        debouncedQuery={debouncedQuery}
        status={status}
        onReload={reloadData}
        onPageChange={setPage}
        onOpenQR={setQrMember}
        onOpenDetail={setDetailMemberId}
        onOpenEdit={setEditingMember}
        onOpenDelete={setDeletingMember}
        onRestore={(m) => void handleRestore(m)}
        restoringId={restoringMemberId}
      />

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
          shopName={shop.name}
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
        <DeleteMemberModal
          deletingMember={deletingMember}
          deleting={deleting}
          onCancel={() => setDeletingMember(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  )
}
