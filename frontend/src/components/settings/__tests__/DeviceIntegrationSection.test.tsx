import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { DeviceIntegrationSection } from "../DeviceIntegrationSection"
import type { Shop } from "../../../lib/auth"
import * as hardwareApi from "../../../lib/hardware"
import * as settingsApi from "../../../lib/settings"

vi.mock("../../../lib/hardware", () => ({
  fetchHardwareDevices: vi.fn(),
  createHardwareDevice: vi.fn(),
  updateHardwareDevice: vi.fn(),
  deleteHardwareDevice: vi.fn(),
  regenerateHardwareDeviceToken: vi.fn(),
  fetchHardwareAccessLogs: vi.fn(),
}))

vi.mock("../../../lib/settings", () => ({
  regenerateDeviceApiKey: vi.fn(),
}))

const mockShop: Shop = {
  id: "shop-1",
  name: "PunchBook Fitness",
  phone: "0901234567",
  email: "owner@punchbook.vn",
  plan: "pro",
  device_api_key: "pb_dev_master_key_123",
}

const mockDevices: hardwareApi.HardwareDevice[] = [
  {
    id: "dev-1",
    shop_id: "shop-1",
    name: "Cổng xoay Sảnh A",
    device_token: "dev_tok_gate1_secret",
    device_type: "turnstile",
    location: "Sảnh A Tầng 1",
    last_ping_at: new Date().toISOString(),
    is_active: true,
    online: true,
    status: "online",
    created_at: "2026-11-17T06:00:00Z",
    updated_at: "2026-11-17T07:00:00Z",
  },
  {
    id: "dev-2",
    shop_id: "shop-1",
    name: "Khóa từ Phòng VIP",
    device_token: "dev_tok_vipdoor_secret",
    device_type: "magnetic_lock",
    location: "Khu vực VIP Tầng 2",
    last_ping_at: "2026-11-17T05:00:00Z",
    is_active: true,
    online: false,
    status: "offline",
    created_at: "2026-11-17T05:00:00Z",
    updated_at: "2026-11-17T05:00:00Z",
  },
]

const mockLogs: hardwareApi.HardwareAccessLog[] = [
  {
    id: "log-1",
    checked_in_at: new Date().toISOString(),
    hardware_device_id: "dev-1",
    device_name: "Cổng xoay Cũ",
    device_type: "turnstile",
    location: "Sảnh B Tầng 1",
    member_name: "Nguyễn Văn A",
    member_id: "mem-1",
    membership_id: "mship-1",
    package_name: "Gói Gym 1 Năm",
    status: "granted",
  },
]

describe("DeviceIntegrationSection", () => {
  const onToast = vi.fn()
  const onShopUpdated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hardwareApi.fetchHardwareDevices).mockResolvedValue(mockDevices)
    vi.mocked(hardwareApi.fetchHardwareAccessLogs).mockResolvedValue(mockLogs)
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
    // Mock window.confirm
    vi.spyOn(window, "confirm").mockReturnValue(true)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("renders device integration section with header, fleet table, and master key", async () => {
    render(
      <DeviceIntegrationSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    expect(screen.getByText(/IoT Access Control|Phần cứng & Cổng kiểm soát/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue("pb_dev_master_key_123")).toBeInTheDocument()

    // Wait for hardware devices to be loaded
    await waitFor(() => {
      expect(screen.getByText("Cổng xoay Sảnh A")).toBeInTheDocument()
      expect(screen.getByText("Khóa từ Phòng VIP")).toBeInTheDocument()
    })

    expect(screen.getByText("Online")).toBeInTheDocument()
    expect(screen.getByText("Offline")).toBeInTheDocument()
  })

  it("copies device token when copy button is clicked", async () => {
    render(
      <DeviceIntegrationSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText("Cổng xoay Sảnh A")).toBeInTheDocument()
    })

    const copyTokenButtons = screen.getAllByTitle(/Sao chép Token|Copy Device Token/i)
    fireEvent.click(copyTokenButtons[0])

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("dev_tok_gate1_secret")
      expect(onToast).toHaveBeenCalledWith(expect.any(String), "success")
    })
  })

  it("toggles device active state when pause/enable button is clicked", async () => {
    const updatedDevice = { ...mockDevices[0], is_active: false }
    vi.mocked(hardwareApi.updateHardwareDevice).mockResolvedValueOnce(updatedDevice)

    render(
      <DeviceIntegrationSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText("Cổng xoay Sảnh A")).toBeInTheDocument()
    })

    const pauseButtons = screen.getAllByTitle(/Tạm dừng thiết bị|Disable Device/i)
    fireEvent.click(pauseButtons[0])

    await waitFor(() => {
      expect(hardwareApi.updateHardwareDevice).toHaveBeenCalledWith("dev-1", {
        is_active: false,
      })
      expect(onToast).toHaveBeenCalledWith(expect.any(String), "success")
    })
  })

  it("regenerates device token with confirmation", async () => {
    const updatedDevice = { ...mockDevices[0], device_token: "dev_tok_fresh_new_token" }
    vi.mocked(hardwareApi.regenerateHardwareDeviceToken).mockResolvedValueOnce(updatedDevice)

    render(
      <DeviceIntegrationSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText("Cổng xoay Sảnh A")).toBeInTheDocument()
    })

    const regenButtons = screen.getAllByTitle(/Cấp lại Token|Regenerate Token/i)
    fireEvent.click(regenButtons[0])

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled()
      expect(hardwareApi.regenerateHardwareDeviceToken).toHaveBeenCalledWith("dev-1")
      expect(onToast).toHaveBeenCalledWith(expect.any(String), "success")
    })
  })

  it("deletes a hardware device after confirmation", async () => {
    vi.mocked(hardwareApi.deleteHardwareDevice).mockResolvedValueOnce()

    render(
      <DeviceIntegrationSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText("Cổng xoay Sảnh A")).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle(/Xóa|Delete/i)
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled()
      expect(hardwareApi.deleteHardwareDevice).toHaveBeenCalledWith("dev-1")
      expect(onToast).toHaveBeenCalledWith(expect.any(String), "success")
    })
  })

  it("opens add device modal and adds newly created device to the table", async () => {
    const newDevice: hardwareApi.HardwareDevice = {
      id: "dev-3",
      shop_id: "shop-1",
      name: "Máy quét QR Cửa Phụ",
      device_token: "dev_tok_new_scanner",
      device_type: "barcode_scanner",
      location: "Khu vực Cửa Phụ",
      last_ping_at: null,
      is_active: true,
      online: false,
      status: "offline",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    vi.mocked(hardwareApi.createHardwareDevice).mockResolvedValueOnce(newDevice)

    render(
      <DeviceIntegrationSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    const addButton = screen.getByRole("button", { name: /Thêm thiết bị mới|Add New Device/i })
    fireEvent.click(addButton)

    expect(screen.getByRole("dialog")).toBeInTheDocument()

    // Fill in name input
    const nameInput = screen.getByPlaceholderText(/Ví dụ: Cổng xoay số 1|Turnstile Gate 1/i)
    fireEvent.change(nameInput, { target: { value: "Máy quét QR Cửa Phụ" } })

    // Submit form (modal button)
    const submitBtn = screen.getByRole("button", { name: /^Thêm thiết bị$|^Add Device$/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(hardwareApi.createHardwareDevice).toHaveBeenCalledWith({
        name: "Máy quét QR Cửa Phụ",
        device_type: "turnstile",
        location: undefined,
        is_active: true,
      })
      expect(screen.getByText("Máy quét QR Cửa Phụ")).toBeInTheDocument()
    })
  })

  it("renders live access stream logs table with member and device info", async () => {
    render(
      <DeviceIntegrationSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument()
      expect(screen.getByText("Gói Gym 1 Năm")).toBeInTheDocument()
      expect(screen.getByText(/Mở cửa thành công|Access Granted/i)).toBeInTheDocument()
    })
  })

  it("regenerates shop master device API key", async () => {
    const updatedShop = { ...mockShop, device_api_key: "pb_dev_master_key_999_fresh" }
    vi.mocked(settingsApi.regenerateDeviceApiKey).mockResolvedValueOnce({
      shop: updatedShop,
      message: "Key regenerated",
    })

    render(
      <DeviceIntegrationSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />,
    )

    const regenMasterBtn = screen.getByTitle(/Tạo lại API Key mới|Generate New API Key/i)
    fireEvent.click(regenMasterBtn)

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled()
      expect(settingsApi.regenerateDeviceApiKey).toHaveBeenCalled()
      expect(onShopUpdated).toHaveBeenCalledWith(updatedShop)
      expect(onToast).toHaveBeenCalledWith(expect.any(String), "success")
    })
  })
})
