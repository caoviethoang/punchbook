import { apiGet, apiPost } from "./api"

export interface Staff {
  id: string
  name: string
  username: string | null
  role: "admin" | "staff"
  created_at?: string
}

export interface Shop {
  id: string
  name: string
  phone: string | null
  address?: string | null
  email: string
  plan: string
  plan_details?: string
  plan_expires_at?: string | null
  bank_name?: string | null
  bank_account_no?: string | null
  bank_account_name?: string | null
}

export interface AuthResponse {
  token: string
  shop: Shop
  staff: Staff | null
}

const TOKEN_KEY = "punchbook_token"

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function login(loginInput: string, password: string, shopEmail?: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>(
    "/auth/login",
    { email: loginInput, username: loginInput, password, shop_email: shopEmail },
    { auth: false }
  )
}

export async function register(input: {
  name: string
  phone: string
  email: string
  password: string
  password_confirmation: string
}): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/auth/register", input, { auth: false })
}

export async function fetchCurrentAuth(token: string): Promise<{ shop: Shop; staff: Staff | null }> {
  const body = await apiGet<{ shop: Shop; staff: Staff | null }>("/auth/me", { token })
  return { shop: body.shop, staff: body.staff }
}

export async function fetchCurrentShop(token: string): Promise<Shop> {
  const { shop } = await fetchCurrentAuth(token)
  return shop
}
