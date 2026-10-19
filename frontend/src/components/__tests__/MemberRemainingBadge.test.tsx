import { render, screen, cleanup } from "@testing-library/react"
import { describe, it, expect, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { MemberRemainingBadge } from "../memberships/MemberRemainingBadge"
import type { Membership } from "../../lib/memberships"

afterEach(() => {
  cleanup()
})

describe("MemberRemainingBadge", () => {
  const baseMembership: Membership = {
    id: "m-1",
    customer_name: "Customer A",
    phone: "0900000000",
    sessions_left: 10,
    expires_at: null,
    package: {
      id: "pkg-1",
      name: "Package 10",
      sessions_count: 10,
      duration_days: null,
    },
  }

  describe("session packages", () => {
    it("renders expired message when sessions_left is 0", () => {
      render(
        <MemberRemainingBadge
          membership={{ ...baseMembership, sessions_left: 0 }}
        />,
      )
      const el = screen.getByText(/Hết buổi \(0\/10\)/i)
      expect(el).toBeInTheDocument()
      expect(el).toHaveClass("text-red-600")
    })

    it("renders amber warning when sessions_left is <= 3", () => {
      render(
        <MemberRemainingBadge
          membership={{ ...baseMembership, sessions_left: 2 }}
        />,
      )
      const el = screen.getByText("Còn 2/10 buổi")
      expect(el).toBeInTheDocument()
      expect(el).toHaveClass("text-amber-600")
    })

    it("renders normal style when sessions_left is > 3", () => {
      render(
        <MemberRemainingBadge
          membership={{ ...baseMembership, sessions_left: 8 }}
        />,
      )
      const el = screen.getByText("Còn 8/10 buổi")
      expect(el).toBeInTheDocument()
      expect(el).toHaveClass("text-indigo-700")
    })
  })

  describe("day-based packages", () => {
    const dayMembership: Membership = {
      ...baseMembership,
      sessions_left: null,
      package: {
        id: "pkg-2",
        name: "Monthly Pass",
        sessions_count: null,
        duration_days: 30,
      },
    }

    it("renders expired message when expires_at is past", () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      render(
        <MemberRemainingBadge
          membership={{ ...dayMembership, expires_at: yesterday.toISOString() }}
        />,
      )
      const el = screen.getByText("Đã hết hạn")
      expect(el).toBeInTheDocument()
      expect(el).toHaveClass("text-red-600")
    })

    it("renders amber warning when expires_at is <= 7 days", () => {
      const in5Days = new Date()
      in5Days.setDate(in5Days.getDate() + 5)
      render(
        <MemberRemainingBadge
          membership={{ ...dayMembership, expires_at: in5Days.toISOString() }}
        />,
      )
      const el = screen.getByText(/Còn \d+ ngày/)
      expect(el).toBeInTheDocument()
      expect(el).toHaveClass("text-amber-600")
    })

    it("renders normal emerald style when expires_at is > 7 days", () => {
      const in20Days = new Date()
      in20Days.setDate(in20Days.getDate() + 20)
      render(
        <MemberRemainingBadge
          membership={{ ...dayMembership, expires_at: in20Days.toISOString() }}
        />,
      )
      const el = screen.getByText(/Còn \d+ ngày/)
      expect(el).toBeInTheDocument()
      expect(el).toHaveClass("text-emerald-700")
    })
  })
})
