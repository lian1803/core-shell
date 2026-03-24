const https = require('https')
const { PrismaClient } = require('./node_modules/.prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()
const JOB_ID = 'cmn1kubo60001ddsoug2lbrvz'
const REGION = '의정부'

function fetchNaverPlace(bizName, region) {
  return new Promise((resolve) => {
    const query = bizName + ' ' + region
    const url = 'https://search.naver.com/search.naver?query=' + encodeURIComponent(query) + '&where=place'
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
    }
    const req = https.get(url, opts, (res) => {
      let d = ''
      res.on('data', (c) => (d += c))
      res.on('end', () => resolve({ html: d, status: res.statusCode }))
    })
    req.on('error', () => resolve({ html: '', status: 0 }))
    req.setTimeout(12000, () => { req.destroy(); resolve({ html: '', status: 0 }) })
  })
}

async function checkBusiness(bizName, region) {
  let { html, status } = await fetchNaverPlace(bizName, region)

  // 응답이 너무 짧으면 (throttled) → 5초 대기 후 재시도
  if (html.length < 100000 || status !== 200) {
    await new Promise(r => setTimeout(r, 5000))
    const retry = await fetchNaverPlace(bizName, region)
    html = retry.html
    status = retry.status
  }

  if (html.length < 100000) return null // 재시도도 실패 → 판단불가

  // 업체명 앞 4자가 결과에 있고 + 장소섹션 존재 여부
  const shortName = bizName.slice(0, Math.min(4, bizName.length))
  const nameInPage = html.includes(shortName)
  const hasPlaceResult = html.length > 350000

  return nameInPage && hasPlaceResult
}

async function main() {
  const contacts = await prisma.contact.findMany({
    where: { jobId: JOB_ID, sources: { contains: 'KAKAO' } },
  })

  console.log(`네이버 교차 검증 시작: ${contacts.length}개`)
  console.log(`배치 방식: 20개마다 10초 휴식, 요청 간격 1.2초\n`)

  let active = 0, closed = 0, unknown = 0

  for (let i = 0; i < contacts.length; i++) {
    // 20개마다 10초 휴식 (네이버 요청 제한 방지)
    if (i > 0 && i % 20 === 0) {
      process.stdout.write(`\n[배치 휴식 10초...]\n`)
      await new Promise(r => setTimeout(r, 10000))
    }

    const c = contacts[i]
    const cleanName = c.bizName.replace('[폐업의심] ', '')
    const exists = await checkBusiness(cleanName, REGION)

    if (exists === false) {
      await prisma.contact.update({
        where: { id: c.id },
        data: { bizName: `[폐업의심] ${cleanName}` },
      })
      closed++
    } else if (exists === true) {
      active++
    } else {
      unknown++
    }

    process.stdout.write(`\r[${i+1}/${contacts.length}] 영업중: ${active} | 폐업의심: ${closed} | 판단불가: ${unknown}`)
    await new Promise(r => setTimeout(r, 1200))
  }

  console.log(`\n\n검증 완료!`)
  console.log(`영업중(네이버 확인): ${active}개`)
  console.log(`폐업의심(네이버 없음): ${closed}개`)
  console.log(`판단불가: ${unknown}개`)

  // CSV 저장
  const all = await prisma.contact.findMany({ where: { jobId: JOB_ID }, orderBy: { category: 'asc' } })

  const makeRow = (c) => {
    const sources = JSON.parse(c.sources)
    const rawSources = JSON.parse(c.rawSources)
    return [
      '"' + (c.bizName || '').replace(/"/g, '""') + '"',
      '"' + (c.category || '').replace(/"/g, '""') + '"',
      c.phone || '',
      '"' + (c.kakao || '').replace(/"/g, '""') + '"',
      c.email || '',
      sources.join(' | '),
      rawSources[0] || '',
    ].join(',')
  }

  const header = '\uFEFF업체명,업종,전화번호,인스타/톡톡,이메일,출처,원본URL\n'

  // 전체 (폐업의심 표시)
  fs.writeFileSync(
    'C:/Users/lian1/Desktop/의정부_풀스캔_네이버검증완료.csv',
    header + all.map(makeRow).join('\n'), 'utf8'
  )

  // 영업중만
  const activeOnly = all.filter(c => !c.bizName.startsWith('[폐업의심]'))
  fs.writeFileSync(
    'C:/Users/lian1/Desktop/의정부_풀스캔_영업중만.csv',
    header + activeOnly.map(makeRow).join('\n'), 'utf8'
  )

  console.log(`\nCSV 저장 완료:`)
  console.log(` - 의정부_풀스캔_네이버검증완료.csv (전체 ${all.length}개)`)
  console.log(` - 의정부_풀스캔_영업중만.csv (${activeOnly.length}개)`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
