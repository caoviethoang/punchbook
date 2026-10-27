import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  apiBaseUrl,
  ApiError,
  apiGet,
  apiPost,
  parseApiResponse,
  resolveApiUrl,
} from "../api"
import { setStoredToken } from "../auth"

describe("api library", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it("has apiBaseUrl ending with /api/v1", () => {
    expect(apiBaseUrl).toMatch(/\/api\/v1$/)
  })

  it("resolves API URLs properly", () => {
    expect(resolveApiUrl("/memberships")).toBe(`${apiBaseUrl}/memberships`)
    expect(resolveApiUrl("memberships")).toBe(`${apiBaseUrl}/memberships`)
    expect(resolveApiUrl("http://example.com/test")).toBe("http://example.com/test")
  })

  it("does not duplicate /api/v1 when path already starts with /api/v1/", () => {
    const url = resolveApiUrl("/api/v1/memberships")
    expect(url).toBe(`${apiBaseUrl}/memberships`)
  })

  it("parses successful JSON response", async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
    const data = await parseApiResponse<{ success: boolean }>(mockResponse)
    expect(data).toEqual({ success: true })
  })

  it("throws ApiError with code and details on error response", async () => {
    const errorBody = {
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: { errors: ["Name is required"] },
    }
    const createErrorResponse = () =>
      new Response(JSON.stringify(errorBody), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      })

    await expect(parseApiResponse(createErrorResponse())).rejects.toThrow(ApiError)

    try {
      await parseApiResponse(createErrorResponse())
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const apiErr = err as ApiError
      expect(apiErr.message).toBe("Validation failed")
      expect(apiErr.code).toBe("VALIDATION_ERROR")
      expect(apiErr.details).toEqual({ errors: ["Name is required"] })
    }
  })

  it("sends request with Authorization token when user is logged in", async () => {
    setStoredToken("jwt_token_123")
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )

    await apiGet("/dashboard")

    expect(fetchSpy).toHaveBeenCalledWith(
      `${apiBaseUrl}/dashboard`,
      expect.objectContaining({
        headers: {
          Authorization: "Bearer jwt_token_123",
          "Content-Type": "application/json",
        },
      })
    )
  })

  it("performs POST request with body and headers", async () => {
    setStoredToken("jwt_token_123")
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "123" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    )

    await apiPost("/packages", { name: "VIP" })

    expect(fetchSpy).toHaveBeenCalledWith(
      `${apiBaseUrl}/packages`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "VIP" }),
      })
    )
  })
})
