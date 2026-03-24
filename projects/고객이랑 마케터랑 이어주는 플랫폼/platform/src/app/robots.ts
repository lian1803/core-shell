import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/*/dashboard',
        '/*/dashboard/',
        '/*/feed',
        '/*/feed/',
        '/*/profile/',
        '/*/portfolio/',
        '/*/requests/new',
        '/*/requests/new/',
        '/*/proposals/',
        '/*/reviews/',
      ],
    },
    sitemap: 'https://platform-mocha-chi.vercel.app/sitemap.xml',
  }
}
