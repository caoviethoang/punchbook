import { render, screen, cleanup } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { KioskCameraScanner } from "../KioskCameraScanner"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("KioskCameraScanner", () => {
  beforeEach(() => {
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      writable: true,
      configurable: true,
    })
  })

  it("renders camera scanner placeholder and scan hints", () => {
    render(<KioskCameraScanner onScan={vi.fn()} />)

    expect(screen.getByText(/Đưa mã QR hội viên vào khung quét|Quét mã QR Hội viên/i)).toBeInTheDocument()
  })

  it("renders permission retry button when camera error occurs", async () => {
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
      writable: true,
      configurable: true,
    })

    render(<KioskCameraScanner onScan={vi.fn()} autoStart={true} />)

    const retryBtn = await screen.findByRole("button", { name: /Mở lại Camera|Bật Camera/i })
    expect(retryBtn).toBeInTheDocument()
  })
})
