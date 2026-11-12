import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { TagPill } from "../TagPill"

describe("TagPill", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders tag name and color dot", () => {
    const { container } = render(
      <TagPill tag={{ id: "t1", name: "VIP", color: "#f59e0b" }} />,
    )

    expect(screen.getByText("VIP")).toBeInTheDocument()
    const circle = container.querySelector("circle")
    expect(circle).toHaveAttribute("fill", "#f59e0b")
  })

  it("calls onRemove when remove button is clicked", () => {
    const onRemove = vi.fn()
    render(
      <TagPill
        tag={{ id: "t1", name: "Student", color: "#06b6d4" }}
        onRemove={onRemove}
        removeAriaLabel="Remove Student"
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Remove Student" }))
    expect(onRemove).toHaveBeenCalledWith("t1")
  })
})
