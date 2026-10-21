import { useEffect, useState } from "react"
import { toApiError } from "../lib/errors"
import {
  deleteMembership,
  type Membership,
} from "../lib/memberships"
import { listPackages, type PackageItem } from "../lib/packages"
import { usePaginatedMemberships } from "./usePaginatedMemberships"

export function useMembershipsQuery() {
  const pagination = usePaginatedMemberships()
  const [packages, setPackages] = useState<PackageItem[]>([])

  // Modal UI state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Membership | null>(null)
  const [qrMember, setQrMember] = useState<Membership | null>(null)
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null)
  const [deletingMember, setDeletingMember] = useState<Membership | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    listPackages()
      .then((pkgs) => {
        if (active) setPackages(pkgs)
      })
      .catch(() => {
        // Ignored or handled gracefully
      })
    return () => {
      active = false
    }
  }, [])

  const handleDelete = async () => {
    if (!deletingMember) return
    setDeleting(true)
    try {
      await deleteMembership(deletingMember.id)
      setDeletingMember(null)
      pagination.reloadData()
    } catch (err) {
      alert(toApiError(err, "Xóa hội viên thất bại."))
    } finally {
      setDeleting(false)
    }
  }

  return {
    ...pagination,
    packages,
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
    handleDelete,
  }
}
