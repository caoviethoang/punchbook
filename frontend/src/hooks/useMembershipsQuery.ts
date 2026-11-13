import { useEffect, useState } from "react"
import { toApiError } from "../lib/errors"
import {
  deleteMembership,
  restoreMembership,
  type Membership,
} from "../lib/memberships"
import { listPackages, type PackageItem } from "../lib/packages"
import { listTags, type MemberTag } from "../lib/tags"
import { usePaginatedMemberships } from "./usePaginatedMemberships"

export function useMembershipsQuery() {
  const pagination = usePaginatedMemberships()
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [tags, setTags] = useState<MemberTag[]>([])

  // Modal UI state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Membership | null>(null)
  const [qrMember, setQrMember] = useState<Membership | null>(null)
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null)
  const [deletingMember, setDeletingMember] = useState<Membership | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [restoringMemberId, setRestoringMemberId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([listPackages(), listTags().catch(() => [])])
      .then(([pkgs, tagList]) => {
        if (!active) return
        setPackages(pkgs)
        setTags(tagList)
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

  const handleRestore = async (member: Membership) => {
    setRestoringMemberId(member.id)
    try {
      await restoreMembership(member.id)
      pagination.reloadData()
    } catch (err) {
      alert(toApiError(err, "Khôi phục hội viên thất bại."))
    } finally {
      setRestoringMemberId(null)
    }
  }

  return {
    ...pagination,
    packages,
    tags,
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
    restoringMemberId,
    handleRestore,
  }
}
