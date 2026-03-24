import { Browser } from 'playwright'
import type { ScraperResult } from '@contact-collector/shared'

interface NaverPlaceItem {
  id: string
  name: string
  tel: string
  virtualTel: string
  category: string[]
  address: string
  roadAddress: string
  homePage?: string
  chatUrl?: string       // 네이버 톡톡 URL (talk.naver.com/...)
  naverBookingUrl?: string
}

interface NaverSearchResult {
  result?: {
    place?: {
      list: NaverPlaceItem[]
      totalCount: number
      page: {
        next?: string
      }
    }
  }
}

interface ScraperOptions {
  keyword: string
  region?: string
  limitCount: number
  delay: number
}

// 소상공인 관련 카테고리 키워드
const BUSINESS_CATEGORIES = [
  '맛집', '카페', '미용실', '학원', '병원', '약국', '편의점',
  '마트', '식당', '빵집', '치킨', '피자', '세탁소', '꽃집',
  '안경점', '부동산', '인테리어', '자동차수리', '네일샵', '헬스장',
]

async function searchNaverPlace(
  page: any,
  searchQuery: string,
  limitCount: number,
  delay: number,
  existingPhones: Set<string>,
  existingTalkUrls: Set<string>
): Promise<ScraperResult[]> {
  const results: ScraperResult[] = []
  const capturedData: NaverSearchResult[] = []

  const handler = async (response: any) => {
    if (response.url().includes('allSearch')) {
      try {
        const data = await response.json()
        capturedData.push(data)
      } catch (e) {}
    }
  }
  page.on('response', handler)

  try {
    const searchUrl = `https://map.naver.com/p/search/${encodeURIComponent(searchQuery)}`
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 2000))

    const processData = () => {
      for (const data of capturedData) {
        const items = data?.result?.place?.list || []
        for (const item of items) {
          const digits = (item.tel || '').replace(/\D/g, '')
          const has010 = digits.startsWith('010') && digits.length === 11
          const chatUrl = item.chatUrl || null

          // 010 번호도 없고 톡톡도 없으면 스킵
          if (!has010 && !chatUrl) continue

          // 중복 체크 (전화번호 기준)
          if (item.tel && existingPhones.has(item.tel)) continue
          // 톡톡만 있는 경우 톡톡 URL 중복 체크
          if (!item.tel && chatUrl && existingTalkUrls.has(chatUrl)) continue

          if (item.tel) existingPhones.add(item.tel)
          if (chatUrl) existingTalkUrls.add(chatUrl)

          results.push({
            bizName: item.name,
            category: item.category?.[0] || undefined,
            phone: has010 ? item.tel : undefined,
            kakao: chatUrl || undefined,  // 네이버 톡톡 URL을 kakao 필드에 저장
            source: 'NAVER',
            rawSource: `https://map.naver.com/p/entry/place/${item.id}`,
          })
          if (results.length >= limitCount) return
        }
      }
    }

    processData()

    // 스크롤로 추가 로드
    if (results.length < limitCount) {
      for (let i = 0; i < 3 && results.length < limitCount; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await new Promise((r) => setTimeout(r, delay))
        processData()
      }
    }
  } finally {
    page.off('response', handler)
  }

  return results
}

export async function NaverScraper(
  browser: Browser,
  options: ScraperOptions
): Promise<ScraperResult[]> {
  const { keyword, region, limitCount, delay } = options
  const results: ScraperResult[] = []
  const seenPhones = new Set<string>()
  const seenTalkUrls = new Set<string>()

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    viewport: { width: 1280, height: 800 },
  })

  const page = await context.newPage()

  try {
    const baseRegion = region || keyword

    // 먼저 원래 키워드로 검색
    const searchQuery = region ? `${region} ${keyword}` : keyword
    console.log(`[Naver] 검색: ${searchQuery}`)
    const initial = await searchNaverPlace(page, searchQuery, limitCount, delay, seenPhones, seenTalkUrls)
    results.push(...initial)

    // 부족하면 카테고리별 추가 검색
    if (results.length < limitCount) {
      for (const cat of BUSINESS_CATEGORIES) {
        if (results.length >= limitCount) break
        const catQuery = `${baseRegion} ${cat}`
        console.log(`[Naver] 카테고리 검색: ${catQuery} (현재 ${results.length}개)`)
        const catResults = await searchNaverPlace(
          page,
          catQuery,
          limitCount - results.length,
          delay,
          seenPhones,
          seenTalkUrls
        )
        results.push(...catResults)
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    console.log(`[Naver] 수집 완료: ${results.length}개 (010번호 + 톡톡 포함)`)
  } finally {
    await context.close()
  }

  return results.slice(0, limitCount)
}
