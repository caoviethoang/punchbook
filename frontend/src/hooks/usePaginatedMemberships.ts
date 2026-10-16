import { useCallback, useEffect, useState } from "react"
import { toApiError } from "../lib/errors"
import {
  fetchMemberships,
  type Membership,
  type PaginationMeta,
  type StatusFilterType,
} from "../lib/memberships"

export interface UsePaginatedMembershipsOptions {
  initialStatus?: StatusFilterType
  initialPage?: number
  perPage?: number
  debounceMs?: number
}

export function usePaginatedMemberships(options: UsePaginatedMembershipsOptions = {}) {
  const {
    initialStatus = "all",
    initialPage = 1,
    perPage = 20,
    debounceMs = 300,
  } = options

  const [memberships, setMemberships] = useState<Membership[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatusState] = useState<StatusFilterType>(initialStatus)
  const [page, setPageState] = useState(initialPage)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      setDebouncedQuery(query)
      setPageState(1)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [query, debounceMs])

  const setStatus = useCallback(
    (nextStatus: StatusFilterType | ((prev: StatusFilterType) => StatusFilterType)) => {
      setLoading(true)
      setStatusState(nextStatus)
      setPageState(1)
    },
    [],
  )

  const setPage = useCallback((nextPage: number | ((prev: number) => number)) => {
    setLoading(true)
    setPageState(nextPage)
  }, [])

  const reloadData = useCallback(() => {
    setLoading(true)
    setRefreshIndex((prev) => prev + 1)
  }, [])

  useEffect(() => {
    let active = true

    const fetchData = async () => {
      try {
        const res = await fetchMemberships({
          query: debouncedQuery,
          status,
          page,
          per_page: perPage,
        })
        if (!active) return
        setMemberships(res.memberships)
        if (res.meta) {
          setMeta(res.meta)
        }
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
  }, [debouncedQuery, status, page, perPage, refreshIndex])

  return {
    memberships,
    meta,
    query,
    setQuery,
    debouncedQuery,
    status,
    setStatus,
    page,
    setPage,
    loading,
    error,
    reloadData,
  }
}
