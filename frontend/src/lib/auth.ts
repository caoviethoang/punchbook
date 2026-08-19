import { apiGet, apiPost } from "./api"

export interface Shop {
  id: string
  name: string
  phone: string | null
  email: string
  plan: string
}

export interface AuthResponse {
  token: string
  shop: Shop
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

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/auth/login", { email, password }, { auth: false })
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

export async function fetchCurrentShop(token: string): Promise<Shop> {
  const body = await apiGet<{ shop: Shop }>("/auth/me", { token })
  return body.shop
}
