import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { KioskSettingsSection } from "../KioskSettingsSection"
import type { Shop } from "../../../lib/auth"
import * as settingsApi from "../../../lib/settings"

vi.mock("../../../lib/settings", () => ({
  updateShopProfile: vi.fn(),
  regenerateKioskToken: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("KioskSettingsSection", () => {
  const onToast = vi.fn()
  const onShopUpdated = vi.fn()

  const mockShop: Shop = {
    id: "shop-1",
    name: "Gym Test",
    phone: "0901234567",
    email: "owner@gym.vn",
    plan: "pro",
    kiosk_enabled: true,
    kiosk_pin: "5678",
    kiosk_welcome_message: "Chào mừng bạn đến với Gym Test!",
    kiosk_audio_enabled: true,
    kiosk_token: "kiosk_token_abc123",
  }

  it("renders kiosk section with URL, PIN, and toggles", () => {
    render(
      <KioskSettingsSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    expect(screen.getByText(/Kiosk Tự phục vụ|kiosk\.settings_title/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue("5678")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Chào mừng bạn đến với Gym Test!")).toBeInTheDocument()
  })

  it("updates settings when save button is clicked", async () => {
    vi.mocked(settingsApi.updateShopProfile).mockResolvedValue({
      shop: {
        ...mockShop,
        kiosk_pin: "9999",
      },
    })

    render(
      <KioskSettingsSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    const pinInput = screen.getByDisplayValue("5678")
    fireEvent.change(pinInput, { target: { value: "9999" } })

    const saveBtn = screen.getByRole("button", { name: /Lưu cài đặt/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(settingsApi.updateShopProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          kiosk_pin: "9999",
        }),
      )
    })
  })

  it("regenerates kiosk token when button is clicked", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true)
    vi.mocked(settingsApi.regenerateKioskToken).mockResolvedValue({
      kiosk_token: "new_kiosk_tok_xyz",
      shop: {
        ...mockShop,
        kiosk_token: "new_kiosk_tok_xyz",
      },
    })

    render(
      <KioskSettingsSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    const regenBtn = screen.getByRole("button", { name: /Tạo lại Kiosk Token/i })
    fireEvent.click(regenBtn)

    await waitFor(() => {
      expect(settingsApi.regenerateKioskToken).toHaveBeenCalled()
      expect(onShopUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          kiosk_token: "new_kiosk_tok_xyz",
        }),
      )
    })
  })

  it("does not render save button for non-admin users", () => {
    render(
      <KioskSettingsSection
        shop={mockShop}
        isAdmin={false}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    expect(screen.queryByRole("button", { name: /Lưu cài đặt/i })).not.toBeInTheDocument()
  })
})
