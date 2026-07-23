import type { GhostPost } from './ghostClient'

const COMPANY_TAG_PATTERN = /^\d{1,2}$/
const FALLBACK_VALUE = '—'

export const COMPANY_BY_TAG_ID: Record<string, string> = {
  '1': 'personal',
  '2': 'open source',
  '3': 'ZOS-IS',
  '4': "O'Clock",
}

export function getProjectCompany(post: GhostPost): string {
  const companyTag = post.tags?.find(tag => COMPANY_TAG_PATTERN.test(tag.name))
  if (!companyTag) return FALLBACK_VALUE
  return COMPANY_BY_TAG_ID[companyTag.name] ?? FALLBACK_VALUE
}

export function getProjectYear(post: GhostPost): string {
  return post.custom_excerpt?.trim() || FALLBACK_VALUE
}
