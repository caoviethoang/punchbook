import { apiDelete, apiGet, apiPatch, apiPost } from "./api"

export interface MemberTag {
  id: string
  shop_id?: string
  name: string
  color: string
}

export const TAG_COLOR_PRESETS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#64748b",
] as const

export async function listTags(): Promise<MemberTag[]> {
  const data = await apiGet<{ tags: MemberTag[] }>("/tags")
  return data.tags
}

export async function createTag(payload: { name: string; color: string }): Promise<MemberTag> {
  const data = await apiPost<{ tag: MemberTag }>("/tags", { tag: payload })
  return data.tag
}

export async function updateTag(
  id: string,
  payload: { name?: string; color?: string },
): Promise<MemberTag> {
  const data = await apiPatch<{ tag: MemberTag }>(`/tags/${id}`, { tag: payload })
  return data.tag
}

export async function deleteTag(id: string): Promise<void> {
  await apiDelete(`/tags/${id}`)
}
