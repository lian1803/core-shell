import type { MetadataRoute } from 'next'

const BASE_URL = 'https://platform-mocha-chi.vercel.app'
const locales = ['ko', 'en', 'zh', 'ja']

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages = ['', '/login', '/signup', '/marketers']

  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const page of publicPages) {
      const isHome = page === ''
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: isHome ? 'daily' : 'weekly',
        priority: isHome ? 1.0 : 0.8,
      })
    }
  }

  return entries
}
