import { useState, useEffect } from "react"
import {
  fetchMemberships,
  deleteMembership,
  type Membership,
  type MembershipPackage,
  type PaginationMeta,
  type StatusFilterType,
} from "../lib/memberships"
import { listPackages } from "../lib/packages"

export function useMembershipsQuery() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [packages, setPackages] = useState<MembershipPackage[]>([])

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatus] = useState<StatusFilterType>("all")
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals state
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

  // Load packages for dropdowns
  useEffect(() => {
    listPackages()
      .then(setPackages)
      .catch(() => {})
  }, [])

  // Load memberships on filter/page change
  useEffect(() => {
    let ignore = false

    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchMemberships({
          query: debouncedQuery,
          status,
          page,
          per_page: 15,
        })
        if (!ignore) {
          setMemberships(res.memberships)
          setMeta(res.meta || null)
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách hội viên.")
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      ignore = true
    }
  }, [debouncedQuery, status, page])

  const reloadData = () => {
    setPage((p) => p)
    setLoading(true)
    fetchMemberships({
      query: debouncedQuery,
      status,
      page,
      per_page: 15,
    })
      .then((res) => {
        setMemberships(res.memberships)
        setMeta(res.meta || null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không thể tải danh sách hội viên.")
      })
      .finally(() => setLoading(false))
  }

  const handleDelete = async () => {
    if (!deletingMember) return
    setDeleting(true)
    try {
      await deleteMembership(deletingMember.id)
      setDeletingMember(null)
      reloadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa hội viên thất bại.")
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
