import { useCallback, useEffect, useState } from "react"
import { toApiError } from "../lib/errors"
import {
  fetchMemberships,
  type Membership,
  type PaginationMeta,
  type StatusFilterType,
} from "../lib/memberships"
import { useDebounce } from "./useDebounce"

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
  const [query, setQueryState] = useState("")
  const debouncedQuery = useDebounce(query, debounceMs)
  const [status, setStatusState] = useState<StatusFilterType>(initialStatus)
  const [page, setPageState] = useState(initialPage)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  const isDebouncing = query !== debouncedQuery
  const loading = fetchLoading || isDebouncing

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery)
    setPageState(1)
  }, [])

  const setStatus = useCallback(
    (nextStatus: StatusFilterType | ((prev: StatusFilterType) => StatusFilterType)) => {
      setFetchLoading(true)
      setStatusState(nextStatus)
      setPageState(1)
    },
    [],
  )

  const setPage = useCallback((nextPage: number | ((prev: number) => number)) => {
    setFetchLoading(true)
    setPageState(nextPage)
  }, [])

  const reloadData = useCallback(() => {
    setFetchLoading(true)
    setRefreshIndex((prev) => prev + 1)
  }, [])

  useEffect(() => {
    let active = true

    const fetchData = async () => {
      setFetchLoading(true)
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
          if (res.meta.total_pages > 0 && page > res.meta.total_pages) {
            setPageState(res.meta.total_pages)
          }
        }
        setError(null)
      } catch (err) {
        if (!active) return
        setError(toApiError(err, "Không thể tải danh sách hội viên."))
      } finally {
        if (active) setFetchLoading(false)
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
