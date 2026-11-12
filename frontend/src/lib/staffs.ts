import { apiDelete, apiGet, apiPost } from "./api"
import type { Staff } from "./auth"

export interface TrainerOption {
  id: string
  name: string
  role: string
}

export async function fetchStaffs(): Promise<Staff[]> {
  const body = await apiGet<{ staffs: Staff[] }>("/staffs")
  return body.staffs
}

export async function fetchTrainers(): Promise<TrainerOption[]> {
  const body = await apiGet<{ trainers: TrainerOption[] }>("/staffs/trainers")
  return body.trainers
}

export async function createStaff(input: {
  name: string
  username: string
  password: string
  role: "admin" | "staff" | "trainer"
}): Promise<Staff> {
  const body = await apiPost<{ staff: Staff }>("/staffs", { staff: input })
  return body.staff
}

export async function deleteStaff(id: string): Promise<void> {
  await apiDelete<{ message: string }>(`/staffs/${id}`)
}

export function formatStaffOptionLabel(staff: { name: string; role?: string }): string {
  const roleLabel =
    staff.role === "admin" ? "Admin" : staff.role === "trainer" ? "HLV / PT" : "Lễ tân"
  const cleanName = staff.name.trim()

  if (/\((?:admin|lễ tân|staff|hlv \/ pt|trainer)\)$/i.test(cleanName)) {
    return cleanName
  }
  return `${cleanName} (${roleLabel})`
}
