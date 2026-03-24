import https from 'https'
import type { Browser } from 'playwright'
import type { ScraperResult } from '@contact-collector/shared'

interface ScraperOptions {
  keyword: string
  region?: string
  limitCount: number
  delay: number
}

interface KakaoPlace {
  name: string
  tel?: string
  talk_channel_id?: string
  address?: string
  new_address?: string
}

const CATEGORIES = [
  // 음식점
  '치킨', '피자', '족발', '삼겹살', '분식', '중국집', '일식', '돈까스',
  '국밥', '냉면', '빵집', '도시락', '맛집', '식당', '떡볶이', '순대국',
  // 뷰티/헬스
  '미용실', '네일', '헬스장', '필라테스', '피부관리', '왁싱', '속눈썹',
  // 카페
  '카페', '커피숍', '버블티',
  // 교육
  '학원', '공부방', '과외', '레슨',
  // 생활
  '세탁소', '청소업체', '인테리어', '수리', '이사', '꽃집',
  // 반려동물
  '반려동물', '동물병원', '애견미용',
]

function kakaoSearch(query: string, page: number): Promise<KakaoPlace[]> {
  return new Promise((resolve) => {
    const url =
      'https://search.map.kakao.com/mapsearch/map.daum?callback=cb' +
      '&q=' + encodeURIComponent(query) +
      '&page=' + page +
      '&size=15&sort=0'

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://map.kakao.com/',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    }

    const req = https.get(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const jsonStr = data
            .replace(/^\/\*\*\/cb\(/, '')
            .replace(/\);\s*$/, '')
          const parsed = JSON.parse(jsonStr)
          resolve((parsed.place as KakaoPlace[]) || [])
        } catch {
          resolve([])
        }
      })
    })

    req.on('error', () => resolve([]))
    req.setTimeout(10000, () => {
      req.destroy()
      resolve([])
    })
  })
}

export async function KakaoScraper(
  _browser: Browser,
  options: ScraperOptions
): Promise<ScraperResult[]> {
  const { region, limitCount } = options
  const results: ScraperResult[] = []
  const seenPhones = new Set<string>()
  const seenChannels = new Set<string>()

  const shortRegion = (region || '')
    .replace(/경기도\s*/, '')
    .replace(/시$/, '')
    .replace(/군$/, '')

  for (const cat of CATEGORIES) {
    if (results.length >= limitCount) break

    const query = `${shortRegion} ${cat}`
    console.log(`[Kakao] 검색: "${query}"`)

    for (let pageNum = 1; pageNum <= 5; pageNum++) {
      if (results.length >= limitCount) break

      const places = await kakaoSearch(query, pageNum)
      if (places.length === 0) break

      for (const place of places) {
        if (results.length >= limitCount) break

        const tel = place.tel || ''
        const digits = tel.replace(/\D/g, '')
        const has010 = digits.startsWith('010') && digits.length === 11
        const talkId = place.talk_channel_id

        if (has010 && !seenPhones.has(digits)) {
          seenPhones.add(digits)
          results.push({
            bizName: place.name,
            category: cat,
            phone: tel,
            source: 'KAKAO',
            rawSource: `https://map.kakao.com/?q=${encodeURIComponent(place.name)}`,
          })
          console.log(`[Kakao] ✅ ${place.name} | ${tel}`)
        } else if (talkId && !has010 && !seenChannels.has(talkId)) {
          // 010은 없지만 카카오톡 채널 있는 경우 — DM 가능
          seenChannels.add(talkId)
          const channelUrl = `https://pf.kakao.com/_${talkId}`
          results.push({
            bizName: place.name,
            category: cat,
            kakao: channelUrl,
            source: 'KAKAO',
            rawSource: `https://map.kakao.com/?q=${encodeURIComponent(place.name)}`,
          })
          console.log(`[Kakao] 💬 ${place.name} | 톡채널`)
        }
      }

      await new Promise((r) => setTimeout(r, 500))
    }

    await new Promise((r) => setTimeout(r, 800))
  }

  console.log(`[Kakao] 완료: ${results.length}개 (010: ${seenPhones.size}개, 톡채널: ${seenChannels.size}개)`)
  return results.slice(0, limitCount)
}
