import { describe, it, expect, vi } from "vitest"
import {
  getPaginationRange,
  fetchMemberships,
  DEFAULT_MEMBERSHIPS_PER_PAGE,
} from "../memberships"
import * as api from "../api"

describe("getPaginationRange", () => {
  it("returns all page numbers when totalPages <= 7", () => {
    expect(getPaginationRange(1, 1)).toEqual([1])
    expect(getPaginationRange(2, 5)).toEqual([1, 2, 3, 4, 5])
    expect(getPaginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("handles start of range with ellipsis at the end", () => {
    expect(getPaginationRange(1, 10)).toEqual([1, 2, 3, 4, 5, "...", 10])
    expect(getPaginationRange(3, 10)).toEqual([1, 2, 3, 4, 5, "...", 10])
    expect(getPaginationRange(4, 10)).toEqual([1, 2, 3, 4, 5, "...", 10])
  })

  it("handles end of range with ellipsis at the start", () => {
    expect(getPaginationRange(8, 10)).toEqual([1, "...", 6, 7, 8, 9, 10])
    expect(getPaginationRange(10, 10)).toEqual([1, "...", 6, 7, 8, 9, 10])
  })

  it("handles middle of range with ellipsis on both sides", () => {
    expect(getPaginationRange(6, 12)).toEqual([1, "...", 5, 6, 7, "...", 12])
  })
})

describe("fetchMemberships", () => {
  it("defaults to page 1 and per_page 20 in API query params", async () => {
    const apiGetSpy = vi.spyOn(api, "apiGet").mockResolvedValue({
      memberships: [],
      meta: { total: 0, page: 1, per_page: 20, total_pages: 1 },
    })

    await fetchMemberships()

    expect(apiGetSpy).toHaveBeenCalledWith("/memberships", {
      query: {
        page: "1",
        per_page: String(DEFAULT_MEMBERSHIPS_PER_PAGE),
      },
    })

    apiGetSpy.mockRestore()
  })

  it("preserves query, status, custom page and per_page", async () => {
    const apiGetSpy = vi.spyOn(api, "apiGet").mockResolvedValue({
      memberships: [],
      meta: { total: 50, page: 3, per_page: 20, total_pages: 3 },
    })

    await fetchMemberships({
      query: "Nguyen",
      status: "active",
      page: 3,
      per_page: 20,
    })

    expect(apiGetSpy).toHaveBeenCalledWith("/memberships", {
      query: {
        page: "3",
        per_page: "20",
        query: "Nguyen",
        status: "active",
      },
    })

    apiGetSpy.mockRestore()
  })
})
