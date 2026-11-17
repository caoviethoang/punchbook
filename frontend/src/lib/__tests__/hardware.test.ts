import { beforeEach, describe, expect, it, vi } from "vitest"
import * as api from "../api"
import {
  fetchHardwareDevices,
  createHardwareDevice,
  updateHardwareDevice,
  deleteHardwareDevice,
  regenerateHardwareDeviceToken,
  fetchHardwareAccessLogs,
  type HardwareDevice,
  type HardwareAccessLog,
} from "../hardware"

vi.mock("../api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

describe("hardware api helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockDevice: HardwareDevice = {
    id: "dev-123",
    shop_id: "shop-456",
    name: "Cổng xoay Lối vào 1",
    device_token: "dev_tok_abc123xyz456",
    device_type: "turnstile",
    location: "Khu vực sảnh A",
    last_ping_at: "2026-11-17T07:00:00Z",
    is_active: true,
    online: true,
    status: "online",
    created_at: "2026-11-17T06:00:00Z",
    updated_at: "2026-11-17T07:00:00Z",
  }

  it("fetchHardwareDevices calls apiGet('/hardware_devices') and returns device array", async () => {
    vi.mocked(api.apiGet).mockResolvedValueOnce({
      hardware_devices: [mockDevice],
    })

    const res = await fetchHardwareDevices()
    expect(api.apiGet).toHaveBeenCalledWith("/hardware_devices")
    expect(res).toEqual([mockDevice])
  })

  it("createHardwareDevice calls apiPost with hardware_device payload", async () => {
    vi.mocked(api.apiPost).mockResolvedValueOnce({
      hardware_device: mockDevice,
      message: "Device created",
    })

    const input = {
      name: "Cổng xoay Lối vào 1",
      device_type: "turnstile" as const,
      location: "Khu vực sảnh A",
      is_active: true,
    }

    const res = await createHardwareDevice(input)
    expect(api.apiPost).toHaveBeenCalledWith("/hardware_devices", {
      hardware_device: input,
    })
    expect(res).toEqual(mockDevice)
  })

  it("updateHardwareDevice calls apiPatch with target path and payload", async () => {
    const updatedDevice = { ...mockDevice, name: "Cổng xoay Cửa Tây" }
    vi.mocked(api.apiPatch).mockResolvedValueOnce({
      hardware_device: updatedDevice,
      message: "Device updated",
    })

    const res = await updateHardwareDevice("dev-123", { name: "Cổng xoay Cửa Tây" })
    expect(api.apiPatch).toHaveBeenCalledWith("/hardware_devices/dev-123", {
      hardware_device: { name: "Cổng xoay Cửa Tây" },
    })
    expect(res).toEqual(updatedDevice)
  })

  it("deleteHardwareDevice calls apiDelete with device ID path", async () => {
    vi.mocked(api.apiDelete).mockResolvedValueOnce({ message: "Deleted" })

    await deleteHardwareDevice("dev-123")
    expect(api.apiDelete).toHaveBeenCalledWith("/hardware_devices/dev-123")
  })

  it("regenerateHardwareDeviceToken calls apiPost to regenerate_token endpoint", async () => {
    const regeneratedDevice = { ...mockDevice, device_token: "dev_tok_newtoken999" }
    vi.mocked(api.apiPost).mockResolvedValueOnce({
      hardware_device: regeneratedDevice,
      message: "Token regenerated",
    })

    const res = await regenerateHardwareDeviceToken("dev-123")
    expect(api.apiPost).toHaveBeenCalledWith("/hardware_devices/dev-123/regenerate_token")
    expect(res.device_token).toBe("dev_tok_newtoken999")
  })

  it("fetchHardwareAccessLogs calls apiGet('/hardware_devices/logs')", async () => {
    const mockLog: HardwareAccessLog = {
      id: "log-1",
      checked_in_at: "2026-11-17T07:15:00Z",
      hardware_device_id: "dev-123",
      device_name: "Cổng xoay Lối vào 1",
      device_type: "turnstile",
      location: "Sảnh A",
      member_name: "Nguyễn Văn A",
      member_id: "mem-1",
      membership_id: "mship-1",
      package_name: "Gói Gym 1 Năm",
      status: "granted",
    }
    vi.mocked(api.apiGet).mockResolvedValueOnce({ logs: [mockLog] })

    const res = await fetchHardwareAccessLogs()
    expect(api.apiGet).toHaveBeenCalledWith("/hardware_devices/logs")
    expect(res).toEqual([mockLog])
  })
})
