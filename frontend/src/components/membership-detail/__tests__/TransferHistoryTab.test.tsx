import { describe, expect, it } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { TransferHistoryTab } from "../TransferHistoryTab"
import type { TransferRecord } from "../../../lib/memberships"

describe("TransferHistoryTab", () => {
  it("renders empty state when transfers array is empty", () => {
    render(<TransferHistoryTab transfers={[]} />)

    expect(screen.getByText("Chưa có lịch sử chuyển nhượng")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Hội viên này chưa thực hiện hoặc nhận chuyển nhượng thẻ tập nào.",
      ),
    ).toBeInTheDocument()
  })

  it("renders transfer history list with outgoing and incoming entries", () => {
    const transfers: TransferRecord[] = [
      {
        id: "tf-1",
        shop_id: "s-1",
        source_membership_id: "mem-current",
        source_customer_name: "Nguyen Van A",
        source_phone: "0901234567",
        target_membership_id: "mem-target",
        target_customer_name: "Le Thi B",
        target_phone: "0987654321",
        staff_id: "st-1",
        staff_name: "HLV Tuấn",
        sessions_transferred: 4,
        days_transferred: null,
        fee: 50000,
        note: "Ghi chú chuyển thẻ",
        created_at: "2026-11-01T10:00:00Z",
      },
      {
        id: "tf-2",
        shop_id: "s-1",
        source_membership_id: "mem-source",
        source_customer_name: "Tran Van C",
        source_phone: "0911223344",
        target_membership_id: "mem-current",
        target_customer_name: "Nguyen Van A",
        target_phone: "0901234567",
        staff_id: null,
        staff_name: null,
        sessions_transferred: null,
        days_transferred: 30,
        fee: 0,
        note: null,
        created_at: "2026-10-15T10:00:00Z",
      },
    ]

    render(
      <TransferHistoryTab
        transfers={transfers}
        currentMembershipId="mem-current"
      />,
    )

    expect(screen.getByText("Chuyển đi")).toBeInTheDocument()
    expect(screen.getByText("Nhận vào")).toBeInTheDocument()
    expect(screen.getByText("Le Thi B")).toBeInTheDocument()
    expect(screen.getByText("Tran Van C")).toBeInTheDocument()
    expect(screen.getByText("4 buổi")).toBeInTheDocument()
    expect(screen.getByText("30 ngày")).toBeInTheDocument()
    expect(screen.getByText("Miễn phí")).toBeInTheDocument()
    expect(screen.getByText("HLV Tuấn")).toBeInTheDocument()
  })
})
