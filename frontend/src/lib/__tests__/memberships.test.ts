import { describe, it, expect } from "vitest"
import { computeMembershipStatus } from "../memberships"

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
        computeMembershipStatus({ sessions_left: 3, expires_at: null }),
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
      in7Days.setDate(in7Days.getDate() + 7)
      expect(
        computeMembershipStatus({
          sessions_left: null,
          expires_at: in7Days.toISOString(),
        }),
      ).toBe("expiring")
    })

    it("returns active when expires_at is more than 7 days away", () => {
      const in10Days = new Date()
      in10Days.setDate(in10Days.getDate() + 10)
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
