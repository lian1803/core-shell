import type { ScraperResult } from '@contact-collector/shared'

interface ContactKey {
  phone?: string
  email?: string
}

/**
 * 연락처 중복 제거
 * 같은 전화번호 또는 이메일을 가진 연락처는 하나로 병합
 */
export function deduplicateContacts(contacts: ScraperResult[]): ScraperResult[] {
  const seen = new Map<string, ScraperResult>()

  for (const contact of contacts) {
    // Create key based on phone or email
    const key = contact.phone || contact.email || contact.bizName

    if (seen.has(key)) {
      // Merge sources
      const existing = seen.get(key)!
      if (contact.source && !existing.source.includes(contact.source)) {
        existing.source = contact.source
      }
      if (contact.kakao && !existing.kakao) {
        existing.kakao = contact.kakao
      }
      if (contact.email && !existing.email) {
        existing.email = contact.email
      }
      if (contact.phone && !existing.phone) {
        existing.phone = contact.phone
      }
    } else {
      seen.set(key, { ...contact })
    }
  }

  return Array.from(seen.values())
}
