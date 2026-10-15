import { describe, expect, it } from "vitest"
import {
  computeMembershipStatus,
  EXPIRING_DAYS_WINDOW,
  EXPIRING_SESSIONS_THRESHOLD,
  isMembershipExhausted,
} from "../memberships"

describe("computeMembershipStatus", () => {
  it("returns expired when sessions_left is 0", () => {
    expect(computeMembershipStatus({ sessions_left: 0, expires_at: null })).toBe("expired")
  })

  it("returns expired when sessions_left is negative", () => {
    expect(computeMembershipStatus({ sessions_left: -1, expires_at: null })).toBe("expired")
  })

  it("returns expiring when sessions_left is 3 (threshold)", () => {
    expect(computeMembershipStatus({ sessions_left: EXPIRING_SESSIONS_THRESHOLD, expires_at: null })).toBe("expiring")
  })

  it("returns expiring when sessions_left is 1 or 2", () => {
    expect(computeMembershipStatus({ sessions_left: 1, expires_at: null })).toBe("expiring")
    expect(computeMembershipStatus({ sessions_left: 2, expires_at: null })).toBe("expiring")
  })

  it("returns active when sessions_left is greater than 3", () => {
    expect(computeMembershipStatus({ sessions_left: 4, expires_at: null })).toBe("active")
    expect(computeMembershipStatus({ sessions_left: 10, expires_at: null })).toBe("active")
  })

  it("returns expired when expires_at is in the past", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(computeMembershipStatus({ sessions_left: null, expires_at: yesterday })).toBe("expired")
  })

  it("returns expiring when expires_at is within 7 days", () => {
    const withinWindow = new Date(Date.now() + (EXPIRING_DAYS_WINDOW - 2) * 24 * 60 * 60 * 1000).toISOString()
    expect(computeMembershipStatus({ sessions_left: null, expires_at: withinWindow })).toBe("expiring")
  })

  it("returns active when expires_at is more than 7 days in the future", () => {
    const outsideWindow = new Date(Date.now() + (EXPIRING_DAYS_WINDOW + 2) * 24 * 60 * 60 * 1000).toISOString()
    expect(computeMembershipStatus({ sessions_left: null, expires_at: outsideWindow })).toBe("active")
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
