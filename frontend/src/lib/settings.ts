import { apiGet, apiPatch, apiPost } from "./api"
import type { Shop } from "./auth"

export interface UpdateProfileInput {
  name: string
  phone: string
  address: string
  bank_name?: string
  bank_account_no?: string
  bank_account_name?: string
}

export interface ChangePasswordInput {
  current_password: string
  password: string
  password_confirmation: string
}

export interface SettingsResponse {
  shop: Shop
  message?: string
}

export async function fetchSettings(): Promise<SettingsResponse> {
  return apiGet<SettingsResponse>("/settings")
}

export async function updateShopProfile(
  input: UpdateProfileInput,
): Promise<SettingsResponse> {
  return apiPatch<SettingsResponse>("/settings/profile", input)
}

export async function changeShopPassword(
  input: ChangePasswordInput,
): Promise<SettingsResponse> {
  return apiPatch<SettingsResponse>("/settings/password", input)
}

export async function upgradeShopPlan(months: number = 1): Promise<SettingsResponse> {
  return apiPost<SettingsResponse>("/settings/upgrade_plan", { months })
}
