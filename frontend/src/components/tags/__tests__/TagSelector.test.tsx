import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { TagSelector } from "../TagSelector"
import * as tagsLib from "../../../lib/tags"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) =>
      typeof fallback === "string" ? fallback : key,
  }),
}))

describe("TagSelector", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("renders tags, displays selected pills, and toggles selection", async () => {
    vi.spyOn(tagsLib, "listTags").mockResolvedValue([
      { id: "tag-1", name: "VIP", color: "#f59e0b" },
      { id: "tag-2", name: "Morning Club", color: "#10b981" },
    ])
    const onChange = vi.fn()

    render(<TagSelector selectedTagIds={["tag-1"]} onChange={onChange} />)

    await waitFor(() => {
      expect(screen.getAllByText("VIP").length).toBeGreaterThanOrEqual(1)
    })

    expect(screen.getByText("Morning Club")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Morning Club" }))
    expect(onChange).toHaveBeenCalledWith(["tag-1", "tag-2"])

    const removeBtn = screen.getByRole("button", { name: "tags.remove_aria" })
    fireEvent.click(removeBtn)
    expect(onChange).toHaveBeenCalledWith([])
  })

  it("quick-creates a new tag and selects it automatically", async () => {
    vi.spyOn(tagsLib, "listTags").mockResolvedValue([])
    const createSpy = vi.spyOn(tagsLib, "createTag").mockResolvedValue({
      id: "tag-new",
      name: "Corporate",
      color: "#10b981",
    })
    const onChange = vi.fn()

    render(<TagSelector selectedTagIds={[]} onChange={onChange} />)

    await waitFor(() => {
      expect(screen.getByText("Chưa có nhãn nào. Tạo nhanh nhãn mới bên dưới.")).toBeInTheDocument()
    })

    const colorButtons = screen.getAllByRole("button", { name: "tags.pick_color" })
    fireEvent.click(colorButtons[1])

    const input = screen.getByPlaceholderText("Tên nhãn mới (VD: VIP, Ca sáng)...")
    fireEvent.change(input, { target: { value: "Corporate" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: "Corporate",
        color: tagsLib.TAG_COLOR_PRESETS[1],
      })
    })
    expect(onChange).toHaveBeenCalledWith(["tag-new"])
  })
})
