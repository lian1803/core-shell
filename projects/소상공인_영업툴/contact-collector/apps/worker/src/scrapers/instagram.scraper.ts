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

function extract010(text: string): string | null {
  const match = text.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/)
  return match ? match[0].replace(/\s/g, '') : null
}

function extractUsername(url: string): string {
  return url.replace(/https?:\/\/(www\.)?instagram\.com\//, '').split('/')[0].split('?')[0]
}

export async function InstagramScraper(
  _browser: Browser,
  options: ScraperOptions
): Promise<ScraperResult[]> {
  const { keyword, region, limitCount, delay } = options
  const results: ScraperResult[] = []
  const seenUsernames = new Set<string>()

  const baseRegion = region?.replace(/경기도\s*/, '').replace(/시$/, '') || keyword

  // stealth 브라우저
  const browser = await stealthChromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    viewport: { width: 1280, height: 800 },
  })

  const searchPage = await context.newPage()
  const profilePage = await context.newPage()

  try {
    // 네이버 검색으로 인스타 계정 찾기 (Google 대신 — 네이버는 봇 차단 안 함)
    const NAVER_QUERIES = [
      `${baseRegion} 소상공인 인스타그램`,
      `${baseRegion} 미용실 인스타`,
      `${baseRegion} 카페 맛집 인스타그램`,
      `${baseRegion} 업체 인스타그램 문의`,
    ]

    const foundProfiles: { url: string; title: string; snippet: string }[] = []

    for (const q of NAVER_QUERIES) {
      if (foundProfiles.length >= limitCount * 4) break

      const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(q)}&where=web`
      console.log(`[Instagram] 네이버 검색: "${q}"`)

      await searchPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await new Promise((r) => setTimeout(r, 2000))

      // 검색 결과에서 인스타 링크 + snippet 텍스트 수집
      const items = await searchPage.evaluate(() => {
        const results: { url: string; title: string; snippet: string }[] = []
        document.querySelectorAll('li.bx, div.total_wrap').forEach((el) => {
          const links = el.querySelectorAll('a[href*="instagram.com/"]')
          links.forEach((a) => {
            const href = (a as HTMLAnchorElement).href
            if (href.includes('/p/') || href.includes('/reel/')) return
            const snippet = el.textContent?.trim().slice(0, 300) || ''
            const titleEl = el.querySelector('a.link_tit, a.title_link, h3 a')
            const title = titleEl?.textContent?.trim() || ''
            results.push({ url: href, title, snippet })
          })
        })
        return results
      })

      // og:title에서 @username 추출 (네이버가 인스타 제목을 캐싱함)
      const metaItems = await searchPage.evaluate(() => {
        const results: { url: string; title: string; snippet: string }[] = []
        // 네이버 검색결과의 인스타그램 관련 항목
        document.querySelectorAll('[data-source*="instagram"], a[href*="instagram.com"]').forEach((el) => {
          const a = el.tagName === 'A' ? el : el.querySelector('a')
          if (!a) return
          const href = (a as HTMLAnchorElement).href
          if (!href.includes('instagram.com') || href.includes('/p/') || href.includes('/reel/')) return
          const parent = a.closest('li, div.bx, div.total_area') || a
          results.push({
            url: href,
            title: a.textContent?.trim() || '',
            snippet: parent.textContent?.trim().slice(0, 300) || '',
          })
        })
        return results
      })

      for (const item of [...items, ...metaItems]) {
        const username = extractUsername(item.url)
        if (!username || username.length < 2 || seenUsernames.has(username)) continue
        seenUsernames.add(username)
        foundProfiles.push({ url: `https://www.instagram.com/${username}/`, title: item.title, snippet: item.snippet })
      }

      await new Promise((r) => setTimeout(r, 1000))
    }

    console.log(`[Instagram] 찾은 계정: ${foundProfiles.length}개`)

    // 각 인스타 프로필 방문 — og:description에서 bio + 010 추출
    for (const { url, title, snippet } of foundProfiles) {
      if (results.length >= limitCount) break

      const username = extractUsername(url)

      // snippet에 이미 010이 있으면 바로 수집 (페이지 방문 절약)
      const phone010fromSnippet = extract010(snippet)

      let phone010: string | null = phone010fromSnippet
      let bizName = title || username

      if (!phone010) {
        // 페이지 방문해서 bio 확인
        try {
          await profilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
          await new Promise((r) => setTimeout(r, delay))

          const meta = await profilePage.evaluate(() => {
            const desc = document.querySelector('meta[property="og:description"]')
            const t = document.querySelector('meta[property="og:title"]')
            return {
              desc: (desc as HTMLMetaElement)?.content || '',
              title: (t as HTMLMetaElement)?.content || '',
            }
          })

          if (meta.title) bizName = meta.title.replace(/ \(@.*?\).*$/, '').trim() || username
          phone010 = extract010(meta.desc || '')
        } catch {
          // 방문 실패 시 username만이라도 저장
        }
      }

      // 인스타 @아이디는 DM 채널로 항상 가치 있음 → 저장
      results.push({
        bizName,
        phone: phone010 || undefined,
        kakao: url,  // 인스타 URL (DM 가능)
        source: 'INSTAGRAM',
        rawSource: url,
      })

      console.log(`[Instagram] @${username} | ${bizName} | 010: ${phone010 || '없음'}`)
      await new Promise((r) => setTimeout(r, 1000))
    }
  } finally {
    await context.close()
    await browser.close()
  }

  console.log(`[Instagram] 완료: ${results.length}개 (@아이디 + 010)`)
  return results.slice(0, limitCount)
}
