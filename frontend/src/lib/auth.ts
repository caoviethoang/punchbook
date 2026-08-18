import { parseApiResponse } from "./api"

const graphqlUrl =
  import.meta.env.VITE_GRAPHQL_API_URL || "http://localhost:3000/graphql"

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  graphqlUrl.replace(/\/graphql\/?$/, "")

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
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  return parseApiResponse<AuthResponse>(response)
}

export async function register(input: {
  name: string
  phone: string
  email: string
  password: string
  password_confirmation: string
}): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return parseApiResponse<AuthResponse>(response)
}

export async function fetchCurrentShop(token: string): Promise<Shop> {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await parseApiResponse<{ shop: Shop }>(response)
  return body.shop
}
