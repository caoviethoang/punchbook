import { apiDelete, apiGet, apiPost } from "./api"
import type { Staff } from "./auth"

export async function fetchStaffs(): Promise<Staff[]> {
  const body = await apiGet<{ staffs: Staff[] }>("/staffs")
  return body.staffs
}

export async function createStaff(input: {
  name: string
  username: string
  password: string
  role: "admin" | "staff"
}): Promise<Staff> {
  const body = await apiPost<{ staff: Staff }>("/staffs", { staff: input })
  return body.staff
}

export async function deleteStaff(id: string): Promise<void> {
  await apiDelete<{ message: string }>(`/staffs/${id}`)
}
