import { describe, expect, it, vi } from "vitest"
import {
  computeMembershipStatus,
  EXPIRING_DAYS_WINDOW,
  EXPIRING_SESSIONS_THRESHOLD,
  extractMembershipIdFromQR,
  isMembershipExhausted,
  getPaginationRange,
  fetchMemberships,
  DEFAULT_MEMBERSHIPS_PER_PAGE,
} from "../memberships"
import * as api from "../api"

describe("computeMembershipStatus", () => {
  describe("session-based memberships", () => {
    it("returns expired when sessions_left is 0", () => {
      expect(
        computeMembershipStatus({ sessions_left: 0, expires_at: null }),
      ).toBe("expired")
    })

    it("returns expired when sessions_left is negative", () => {
      expect(
        computeMembershipStatus({ sessions_left: -1, expires_at: null }),
      ).toBe("expired")
    })

    it("returns expiring when sessions_left is 1, 2, or 3", () => {
      expect(
        computeMembershipStatus({ sessions_left: 1, expires_at: null }),
      ).toBe("expiring")
      expect(
        computeMembershipStatus({ sessions_left: 2, expires_at: null }),
      ).toBe("expiring")
      expect(
        computeMembershipStatus({ sessions_left: EXPIRING_SESSIONS_THRESHOLD, expires_at: null }),
      ).toBe("expiring")
    })

    it("returns active when sessions_left is greater than 3", () => {
      expect(
        computeMembershipStatus({ sessions_left: 4, expires_at: null }),
      ).toBe("active")
      expect(
        computeMembershipStatus({ sessions_left: 10, expires_at: null }),
      ).toBe("active")
    })
  })

  describe("date-based memberships", () => {
    it("returns expired when expires_at is yesterday", () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(
        computeMembershipStatus({
          sessions_left: null,
          expires_at: yesterday.toISOString(),
        }),
      ).toBe("expired")
    })

    it("returns expiring when expires_at is today", () => {
      const today = new Date()
      expect(
        computeMembershipStatus({
          sessions_left: null,
          expires_at: today.toISOString(),
        }),
      ).toBe("expiring")
    })

    it("returns expiring when expires_at is within 7 days", () => {
      const in3Days = new Date()
      in3Days.setDate(in3Days.getDate() + 3)
      expect(
        computeMembershipStatus({
          sessions_left: null,
          expires_at: in3Days.toISOString(),
        }),
      ).toBe("expiring")

      const in7Days = new Date()
      in7Days.setDate(in7Days.getDate() + EXPIRING_DAYS_WINDOW)
      expect(
        computeMembershipStatus({
          sessions_left: null,
          expires_at: in7Days.toISOString(),
        }),
      ).toBe("expiring")
    })

    it("returns active when expires_at is more than 7 days away", () => {
      const in10Days = new Date()
      in10Days.setDate(in10Days.getDate() + EXPIRING_DAYS_WINDOW + 3)
      expect(
        computeMembershipStatus({
          sessions_left: null,
          expires_at: in10Days.toISOString(),
        }),
      ).toBe("active")
    })
  })

  describe("unlimited memberships", () => {
    it("returns active when neither sessions_left nor expires_at is specified", () => {
      expect(
        computeMembershipStatus({ sessions_left: null, expires_at: null }),
      ).toBe("active")
    })
  })
})

describe("isMembershipExhausted", () => {
  it("returns true when sessions_left is 0 or negative", () => {
    expect(isMembershipExhausted({ sessions_left: 0, expires_at: null })).toBe(true)
    expect(isMembershipExhausted({ sessions_left: -1, expires_at: null })).toBe(true)
  })

  it("returns false when sessions_left is positive", () => {
    expect(isMembershipExhausted({ sessions_left: 1, expires_at: null })).toBe(false)
    expect(isMembershipExhausted({ sessions_left: 3, expires_at: null })).toBe(false)
  })

  it("returns true when expires_at has passed", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(isMembershipExhausted({ sessions_left: null, expires_at: yesterday })).toBe(true)
  })

  it("returns false when expires_at is in the future", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    expect(isMembershipExhausted({ sessions_left: null, expires_at: future })).toBe(false)
  })
})

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

describe("extractMembershipIdFromQR", () => {
  it("extracts UUID from PUNCHBOOK:id prefix", () => {
    expect(extractMembershipIdFromQR("PUNCHBOOK:123e4567-e89b-12d3-a456-426614174000")).toBe(
      "123e4567-e89b-12d3-a456-426614174000",
    )
  })

  it("handles whitespace around PUNCHBOOK: prefix", () => {
    expect(extractMembershipIdFromQR("  PUNCHBOOK:uuid-abc-123  ")).toBe("uuid-abc-123")
  })

  it("returns raw trimmed string when no prefix is present", () => {
    expect(extractMembershipIdFromQR("  123e4567-e89b-12d3-a456-426614174000  ")).toBe(
      "123e4567-e89b-12d3-a456-426614174000",
    )
  })

  it("extracts membership_id from JSON payload", () => {
    expect(extractMembershipIdFromQR('{"membership_id": "mem-123", "action": "check_in"}')).toBe(
      "mem-123",
    )
  })

  it("extracts id from JSON payload", () => {
    expect(extractMembershipIdFromQR('{"id": "mem-456"}')).toBe("mem-456")
  })

  it("extracts ID from URL path", () => {
    expect(
      extractMembershipIdFromQR("https://punchbook.vn/memberships/uuid-999?source=qr"),
    ).toBe("uuid-999")
  })
})
