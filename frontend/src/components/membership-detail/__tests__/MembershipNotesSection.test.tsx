import { describe, expect, it, vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MembershipNotesSection } from "../MembershipNotesSection"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("MembershipNotesSection", () => {
  it("renders empty state with 'Thêm ghi chú' button when notes are blank", () => {
    render(<MembershipNotesSection notes={null} onSaveNotes={vi.fn()} />)

    expect(screen.getByText("Chưa có ghi chú nội bộ cho hội viên này")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Thêm ghi chú/i })).toBeInTheDocument()
  })

  it("renders prominent notes card with edit button when notes exist", () => {
    render(
      <MembershipNotesSection
        notes="Khách dị ứng phấn hoa, lưu ý phòng thoáng khí"
        onSaveNotes={vi.fn()}
      />,
    )

    expect(screen.getByText("Ghi chú nội bộ")).toBeInTheDocument()
    expect(screen.getByText("Khách dị ứng phấn hoa, lưu ý phòng thoáng khí")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Chỉnh sửa ghi chú/i })).toBeInTheDocument()
  })

  it("allows staff to edit and save updated notes", async () => {
    const user = userEvent.setup()
    const handleSave = vi.fn().mockResolvedValue(undefined)

    render(
      <MembershipNotesSection
        notes="Ghi chú ban đầu"
        onSaveNotes={handleSave}
      />,
    )

    // Click edit
    await user.click(screen.getByRole("button", { name: /Chỉnh sửa ghi chú/i }))

    const textarea = screen.getByPlaceholderText(/Nhập ghi chú/i)
    expect(textarea).toHaveValue("Ghi chú ban đầu")

    // Update text and save
    await user.clear(textarea)
    await user.type(textarea, "Ưu tiên PT nam hướng dẫn")
    await user.click(screen.getByRole("button", { name: /Lưu ghi chú/i }))

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("Ưu tiên PT nam hướng dẫn")
    })
  })

  it("allows staff to add notes from empty state", async () => {
    const user = userEvent.setup()
    const handleSave = vi.fn().mockResolvedValue(undefined)

    render(<MembershipNotesSection notes={null} onSaveNotes={handleSave} />)

    // Click add notes
    await user.click(screen.getByRole("button", { name: /Thêm ghi chú/i }))

    const textarea = screen.getByPlaceholderText(/Nhập ghi chú/i)
    await user.type(textarea, "Thoát vị đĩa đệm nhẹ")
    await user.click(screen.getByRole("button", { name: /Lưu ghi chú/i }))

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("Thoát vị đĩa đệm nhẹ")
    })
  })

  it("cancels editing without saving", async () => {
    const user = userEvent.setup()
    const handleSave = vi.fn()

    render(
      <MembershipNotesSection
        notes="Ghi chú hiện tại"
        onSaveNotes={handleSave}
      />,
    )

    await user.click(screen.getByRole("button", { name: /Chỉnh sửa ghi chú/i }))

    const textarea = screen.getByPlaceholderText(/Nhập ghi chú/i)
    await user.type(textarea, " - thêm nội dung mới")

    // Click cancel
    await user.click(screen.getByRole("button", { name: /Hủy/i }))

    expect(handleSave).not.toHaveBeenCalled()
    expect(screen.getByText("Ghi chú hiện tại")).toBeInTheDocument()
  })

  it("displays error message if saving fails", async () => {
    const user = userEvent.setup()
    const handleSave = vi.fn().mockRejectedValue(new Error("Lỗi kết nối máy chủ"))

    render(
      <MembershipNotesSection
        notes="Ghi chú ban đầu"
        onSaveNotes={handleSave}
      />,
    )

    await user.click(screen.getByRole("button", { name: /Chỉnh sửa ghi chú/i }))
    await user.click(screen.getByRole("button", { name: /Lưu ghi chú/i }))

    await waitFor(() => {
      expect(screen.getByText("Lỗi kết nối máy chủ")).toBeInTheDocument()
    })
  })
})
