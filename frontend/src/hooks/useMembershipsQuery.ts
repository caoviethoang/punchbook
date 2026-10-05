import { useCallback, useEffect, useState } from "react"
import { toApiError } from "../lib/errors"
import {
  deleteMembership,
  fetchMemberships,
  type Membership,
  type PaginationMeta,
  type StatusFilterType,
} from "../lib/memberships"
import { listPackages, type PackageItem } from "../lib/packages"

export function useMembershipsQuery() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [packages, setPackages] = useState<PackageItem[]>([])

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatus] = useState<StatusFilterType>("all")
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  // Modal UI state
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

  const reloadData = useCallback(() => {
    setLoading(true)
    setRefreshIndex((prev) => prev + 1)
  }, [])

  useEffect(() => {
    let active = true

    const fetchData = async () => {
      try {
        const [membershipsRes, pkgs] = await Promise.all([
          fetchMemberships({
            query: debouncedQuery,
            status,
            page,
            per_page: 20,
          }),
          listPackages(),
        ])
        if (!active) return
        setMemberships(membershipsRes.memberships)
        if (membershipsRes.meta) {
          setMeta(membershipsRes.meta)
        }
        setPackages(pkgs)
        setError(null)
      } catch (err) {
        if (!active) return
        setError(toApiError(err, "Không thể tải danh sách hội viên."))
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchData()

    return () => {
      active = false
    }
  }, [debouncedQuery, status, page, refreshIndex])

  const handleDelete = async () => {
    if (!deletingMember) return
    setDeleting(true)
    try {
      await deleteMembership(deletingMember.id)
      setDeletingMember(null)
      reloadData()
    } catch (err) {
      alert(toApiError(err, "Xóa hội viên thất bại."))
    } finally {
      setDeleting(false)
    }
  }

  return {
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
  }
}
