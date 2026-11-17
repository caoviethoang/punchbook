import { render, screen, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { TodaysBirthdaysWidget } from "../TodaysBirthdaysWidget"
import type { Membership } from "../../../lib/memberships"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("TodaysBirthdaysWidget", () => {
  const dummyMember1: Membership = {
    id: "m-1",
    customer_name: "Nguyen Van A",
    phone: "0901234567",
    sessions_left: 10,
    expires_at: null,
    package: {
      id: "pkg-1",
      name: "Gói 10 buổi",
      sessions_count: 10,
    },
    checked_in_today: false,
    last_checked_in_at: null,
    is_birthday_today: true,
  }

  const dummyMember2: Membership = {
    id: "m-2",
    customer_name: "Tran Thi B",
    phone: "0912345678",
    sessions_left: 5,
    expires_at: null,
    package: {
      id: "pkg-2",
      name: "Gói 10 buổi",
      sessions_count: 10,
    },
    checked_in_today: false,
    last_checked_in_at: null,
    is_birthday_today: true,
  }

  it("returns null when birthdays array is empty", () => {
    const { container } = render(<TodaysBirthdaysWidget birthdays={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders birthday count and member buttons", () => {
    render(
      <TodaysBirthdaysWidget
        birthdays={[dummyMember1, dummyMember2]}
        onFilterBirthdays={vi.fn()}
        onViewMember={vi.fn()}
      />,
    )

    expect(screen.getByRole("region", { name: /Hội viên sinh nhật hôm nay/i })).toBeInTheDocument()
    expect(screen.getByText(/Hôm nay có 2 hội viên sinh nhật!/i)).toBeInTheDocument()
    expect(screen.getByText("Nguyen Van A")).toBeInTheDocument()
    expect(screen.getByText("Tran Thi B")).toBeInTheDocument()
  })

  it("calls onViewMember when member pill is clicked", async () => {
    const user = userEvent.setup()
    const onViewMemberMock = vi.fn()

    render(
      <TodaysBirthdaysWidget
        birthdays={[dummyMember1]}
        onViewMember={onViewMemberMock}
      />,
    )

    const memberBtn = screen.getByRole("button", { name: /Nguyen Van A/i })
    await user.click(memberBtn)

    expect(onViewMemberMock).toHaveBeenCalledWith("m-1")
  })

  it("calls onFilterBirthdays when filter button is clicked", async () => {
    const user = userEvent.setup()
    const onFilterMock = vi.fn()

    render(
      <TodaysBirthdaysWidget
        birthdays={[dummyMember1]}
        onFilterBirthdays={onFilterMock}
      />,
    )

    const filterBtn = screen.getByRole("button", { name: /Lọc danh sách sinh nhật/i })
    await user.click(filterBtn)

    expect(onFilterMock).toHaveBeenCalledTimes(1)
  })
})
