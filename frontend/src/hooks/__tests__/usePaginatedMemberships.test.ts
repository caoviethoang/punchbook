import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { usePaginatedMemberships } from "../usePaginatedMemberships"
import * as membershipsApi from "../../lib/memberships"
import type { Membership } from "../../lib/memberships"

describe("usePaginatedMemberships", () => {
  const dummyMembership: Membership = {
    id: "mem-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    sessions_left: 5,
    expires_at: null,
    package: {
      id: "pkg-1",
      name: "Gói 10 buổi",
    },
  }

  beforeEach(() => {
    vi.spyOn(membershipsApi, "fetchMemberships").mockResolvedValue({
      memberships: [dummyMembership],
      meta: {
        page: 1,
        per_page: 20,
        total: 1,
        total_pages: 1,
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("loads memberships on mount and does NOT stay stuck in loading state after debounce delay", async () => {
    const { result } = renderHook(() => usePaginatedMemberships())

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.memberships).toEqual([dummyMembership])
    expect(result.current.meta?.total).toBe(1)

    // Wait past the 300ms debounce window
    await new Promise((resolve) => setTimeout(resolve, 350))

    // Must still NOT be loading!
    expect(result.current.loading).toBe(false)
  })

  it("updates query and fetches debounced search results", async () => {
    const { result } = renderHook(() => usePaginatedMemberships({ debounceMs: 100 }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.setQuery("Nguyen")
    })

    // Immediately shows loading while debouncing
    expect(result.current.loading).toBe(true)
    expect(result.current.query).toBe("Nguyen")

    // After debounce delay, fetchMemberships is called with query
    await waitFor(() => {
      expect(membershipsApi.fetchMemberships).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "Nguyen",
          page: 1,
        }),
      )
      expect(result.current.loading).toBe(false)
    })
  })

  it("resets page and triggers reload when changing status", async () => {
    const { result } = renderHook(() => usePaginatedMemberships())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.setStatus("expiring")
    })

    await waitFor(() => {
      expect(membershipsApi.fetchMemberships).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "expiring",
          page: 1,
        }),
      )
      expect(result.current.loading).toBe(false)
    })
  })
})
