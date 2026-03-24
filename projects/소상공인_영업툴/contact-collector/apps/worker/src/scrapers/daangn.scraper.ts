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

// 카테고리별 검색어
const CATEGORIES = [
  // 음식점 (세분화)
  '치킨', '피자', '족발', '삼겹살', '분식', '중국집', '일식', '돈까스',
  '국밥', '냉면', '제과점', '빵집', '도시락', '맛집',
  // 뷰티/헬스
  '미용실', '네일', '헬스', '필라테스', '피부관리', '왁싱',
  // 카페/음료
  '카페', '커피', '버블티',
  // 교육
  '학원', '과외', '레슨', '공부방',
  // 생활서비스
  '세탁소', '청소', '수리', '인테리어', '도배', '이사', '용달',
  // 기타
  '꽃집', '반려동물', '동물병원', '약국',
]

export async function DaangnScraper(
  _browser: Browser,
  options: ScraperOptions
): Promise<ScraperResult[]> {
  const { region, limitCount, delay } = options
  const results: ScraperResult[] = []
  const seenPhones = new Set<string>()
  const seenUrls = new Set<string>()

  const baseRegion = region || ''
  // 포천시 → 포천 (당근 검색은 짧게)
  const shortRegion = baseRegion.replace(/경기도\s*/, '').replace(/시$/, '').replace(/군$/, '')

  // stealth 브라우저 직접 생성 (playwright-extra 방식)
  const browser = await stealthChromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    viewport: { width: 1280, height: 800 },
  })

  const listPage = await context.newPage()
  const detailPage = await context.newPage()

  try {
    for (const cat of CATEGORIES) {
      if (results.length >= limitCount) break

      const searchQ = `${shortRegion} ${cat}`
      const searchUrl = `https://www.daangn.com/kr/local-profile/s/?search=${encodeURIComponent(searchQ)}`
      console.log(`[Daangn] 검색: "${searchQ}"`)

      await listPage.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await new Promise((r) => setTimeout(r, 2500))

      // 업체 프로필 링크 수집
      const profileLinks = await listPage.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="/local-profile/"]'))
          .map((a) => (a as HTMLAnchorElement).href)
          .filter((h) => !/\/local-profile\/s\//.test(h))
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .slice(0, 30)
      })

      for (const profileUrl of profileLinks) {
        if (results.length >= limitCount) break
        if (seenUrls.has(profileUrl)) continue
        seenUrls.add(profileUrl)

        try {
          await detailPage.goto(profileUrl, { waitUntil: 'networkidle', timeout: 20000 })
          await new Promise((r) => setTimeout(r, Math.min(delay, 2000)))

          const { bizName, phones, tel } = await detailPage.evaluate(() => {
            const h = document.querySelector('h1, h2')?.textContent?.trim() || ''
            const body = document.body.innerText
            const phoneMatches = body.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []
            const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]'))
              .map((a) => (a as HTMLAnchorElement).href.replace('tel:', '').trim())
            return {
              bizName: h,
              phones: [...new Set(phoneMatches.map((p: string) => p.replace(/\s/g, '')))],
              tel: telLinks,
            }
          })

          // tel 링크에서도 010 추출
          const all010 = [...new Set([...phones, ...tel.filter((t) => t.replace(/\D/g, '').startsWith('010'))])]

          if (all010.length > 0) {
            for (const phone of all010) {
              const digits = phone.replace(/\D/g, '')
              if (!seenPhones.has(digits)) {
                seenPhones.add(digits)
                results.push({
                  bizName: bizName || cat,
                  category: cat,
                  phone,
                  source: 'DAANGN',
                  rawSource: profileUrl,
                })
                console.log(`[Daangn] ✅ ${bizName} | ${phone}`)
              }
            }
          }
        } catch {
          // 개별 페이지 오류는 스킵
        }

        await new Promise((r) => setTimeout(r, 1000))
      }

      await new Promise((r) => setTimeout(r, 1500))
    }

    console.log(`[Daangn] 완료: ${results.length}개 (010번호 있는 업체)`)
  } finally {
    await context.close()
    await browser.close()
  }

  return results.slice(0, limitCount)
}
