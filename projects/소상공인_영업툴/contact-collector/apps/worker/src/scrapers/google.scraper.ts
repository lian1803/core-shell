import type { Browser } from 'playwright'
import { chromium as stealthChromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import type { ScraperResult } from '@contact-collector/shared'

stealthChromium.use(StealthPlugin())

interface ScraperOptions {
  keyword: string
  region?: string
  limitCount: number
  delay: number
}

function extract010(text: string): string[] {
  const matches = text.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []
  return [...new Set(matches.map((p) => p.replace(/\s/g, '')))]
}

const CATEGORIES = [
  '치킨', '피자', '족발', '삼겹살', '분식', '맛집', '카페',
  '미용실', '네일', '헬스', '학원', '과외', '세탁소',
  '꽃집', '반려동물', '인테리어', '수리',
]

export async function GoogleScraper(
  _browser: Browser,
  options: ScraperOptions
): Promise<ScraperResult[]> {
  const { region, limitCount } = options
  const results: ScraperResult[] = []
  const seenPhones = new Set<string>()

  const shortRegion = (region || '')
    .replace(/경기도\s*/, '')
    .replace(/시$/, '')
    .replace(/군$/, '')

  const browser = await stealthChromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    viewport: { width: 1280, height: 800 },
  })

  const page = await context.newPage()

  try {
    for (const cat of CATEGORIES) {
      if (results.length >= limitCount) break

      // DuckDuckGo HTML 버전 (CAPTCHA 없음, 한국어 검색 가능)
      const q = `${shortRegion} ${cat} 010`
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=kr-kr`
      console.log(`[DDG검색] "${q}"`)

      try {
        await page.goto(ddgUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
        await new Promise((r) => setTimeout(r, 1500))

        // 검색결과에서 010 직접 추출
        const items = await page.evaluate(() => {
          const results: { title: string; snippet: string; url: string }[] = []
          document.querySelectorAll('.result').forEach((el) => {
            const title = el.querySelector('.result__title')?.textContent?.trim() || ''
            const snippet = el.querySelector('.result__snippet')?.textContent?.trim() || ''
            const link = el.querySelector('a.result__url') as HTMLAnchorElement | null
            results.push({ title, snippet, url: link?.href || '' })
          })
          return results
        })

        for (const item of items) {
          const fullText = `${item.title} ${item.snippet}`
          const phones = extract010(fullText)
          for (const phone of phones) {
            const d = phone.replace(/\D/g, '')
            if (!seenPhones.has(d)) {
              seenPhones.add(d)
              results.push({
                bizName: item.title || `${shortRegion} ${cat}`,
                category: cat,
                phone,
                source: 'GOOGLE',
                rawSource: item.url,
              })
            }
          }
        }
      } catch (e: any) {
        console.log(`[DDG검색] ${cat} 실패: ${e.message}`)
      }

      await new Promise((r) => setTimeout(r, 1200))
    }

    console.log(`[DDG검색] 완료: ${results.length}개`)
  } finally {
    await context.close()
    await browser.close()
  }

  return results.slice(0, limitCount)
}
