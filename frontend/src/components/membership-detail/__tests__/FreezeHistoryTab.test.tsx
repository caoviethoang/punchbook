import { render, screen, cleanup } from "@testing-library/react"
import { describe, it, expect, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { FreezeHistoryTab } from "../FreezeHistoryTab"
import type { FreezeHistoryItem } from "../../../lib/memberships"

afterEach(() => {
  cleanup()
})

describe("FreezeHistoryTab", () => {
  it("renders empty state when freezeHistory is empty", () => {
    render(<FreezeHistoryTab freezeHistory={[]} />)

    expect(screen.getByText("Chưa có lịch sử bảo lưu")).toBeInTheDocument()
    expect(
      screen.getByText("Hội viên này chưa từng thực hiện bảo lưu hoặc mở khóa thẻ."),
    ).toBeInTheDocument()
  })

  it("renders freeze and unfreeze items with details", () => {
    const history: FreezeHistoryItem[] = [
      {
        id: "log-1",
        action: "membership_frozen",
        created_at: "2026-11-01T10:00:00Z",
        staff_name: "Coach Alex",
        details: {
          frozen_until: "2026-11-15",
          freeze_days: 14,
          reason: "Nghỉ mát",
        },
      },
      {
        id: "log-2",
        action: "membership_unfrozen",
        created_at: "2026-11-08T10:00:00Z",
        staff_name: "Coach Alex",
        details: {
          days_extended: 7,
          new_expires_at: "2026-12-07",
          reason: "Về sớm",
        },
      },
    ]

    render(<FreezeHistoryTab freezeHistory={history} />)

    expect(screen.getByText("Bảo lưu")).toBeInTheDocument()
    expect(screen.getByText("Mở khóa")).toBeInTheDocument()
    expect(screen.getByText(/Nghỉ mát/i)).toBeInTheDocument()
    expect(screen.getByText(/Về sớm/i)).toBeInTheDocument()
    expect(screen.getByText(/Gia hạn thêm:/i)).toBeInTheDocument()
  })
})
