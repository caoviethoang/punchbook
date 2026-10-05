import { type Shop, type Staff } from "../lib/auth"
import { useMembershipsQuery } from "../hooks/useMembershipsQuery"

import { DeleteMemberModal } from "./memberships/DeleteMemberModal"
import { MembershipFilterBar } from "./memberships/MembershipFilterBar"
import { MembershipHeader } from "./memberships/MembershipHeader"
import { MembershipTable } from "./memberships/MembershipTable"

import { ImportMembersModal } from "./ImportMembersModal"
import { MemberCreateForm } from "./MembershipCreateForm"
import { MemberDetailModal } from "./MembershipDetailModal"
import { MemberEditModal } from "./MemberEditModal"
import { MemberQRModal } from "./MemberQRModal"

interface MembershipsScreenProps {
  shop: Shop
  currentStaff?: Staff | null
}

export function MembershipsScreen({ shop, currentStaff }: MembershipsScreenProps) {
  const isAdmin = !currentStaff || currentStaff.role === "admin"

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
  } = useMembershipsQuery()

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <MembershipHeader
        meta={meta}
        isAdmin={isAdmin}
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
      />

      {/* Modals Integration */}
      {/* 1. Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg">
            <MemberCreateForm
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
        <MemberDetailModal
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
