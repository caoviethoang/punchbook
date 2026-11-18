import { apiGet, apiPost, apiPatch, apiDelete } from "./api"

export type DeviceType = "turnstile" | "magnetic_lock" | "barcode_scanner" | "nfc_reader"

export interface HardwareDevice {
  id: string
  shop_id: string
  name: string
  device_token: string
  device_type: DeviceType
  location: string | null
  last_ping_at: string | null
  is_active: boolean
  online: boolean
  status: "online" | "offline"
  created_at: string
  updated_at: string
}

export interface HardwareAccessLog {
  id: string
  checked_in_at: string
  hardware_device_id: string
  device_name: string | null
  device_type: DeviceType | null
  location: string | null
  member_name: string | null
  member_id: string | null
  membership_id: string | null
  package_name: string | null
  status: "granted"
}

export interface CreateHardwareDeviceInput {
  name: string
  device_type: DeviceType
  location?: string
  is_active?: boolean
}

export interface UpdateHardwareDeviceInput {
  name?: string
  device_type?: DeviceType
  location?: string
  is_active?: boolean
}

export interface HardwareDevicesResponse {
  hardware_devices: HardwareDevice[]
}

export interface HardwareDeviceResponse {
  hardware_device: HardwareDevice
  message?: string
}

export interface HardwareAccessLogsResponse {
  logs: HardwareAccessLog[]
}

export async function fetchHardwareDevices(): Promise<HardwareDevice[]> {
  const res = await apiGet<HardwareDevicesResponse>("/hardware_devices")
  return res.hardware_devices
}

export async function createHardwareDevice(input: CreateHardwareDeviceInput): Promise<HardwareDevice> {
  const res = await apiPost<HardwareDeviceResponse>("/hardware_devices", {
    hardware_device: input,
  })
  return res.hardware_device
}

export async function updateHardwareDevice(id: string, input: UpdateHardwareDeviceInput): Promise<HardwareDevice> {
  const res = await apiPatch<HardwareDeviceResponse>(`/hardware_devices/${id}`, {
    hardware_device: input,
  })
  return res.hardware_device
}

export async function deleteHardwareDevice(id: string): Promise<void> {
  await apiDelete<{ message: string }>(`/hardware_devices/${id}`)
}

export async function regenerateHardwareDeviceToken(id: string): Promise<HardwareDevice> {
  const res = await apiPost<HardwareDeviceResponse>(`/hardware_devices/${id}/regenerate_token`)
  return res.hardware_device
}

export async function fetchHardwareAccessLogs(): Promise<HardwareAccessLog[]> {
  const res = await apiGet<HardwareAccessLogsResponse>("/hardware_devices/logs")
  return res.logs
}
