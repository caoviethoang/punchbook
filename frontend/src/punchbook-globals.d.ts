import type * as membershipsApi from "./lib/memberships"

declare global {
  interface Window {
    punchbookMemberships?: typeof membershipsApi
  }
}

export {}
