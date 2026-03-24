const https = require('https')
const { PrismaClient } = require('./node_modules/.prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

const JOBS = [
  { id: 'cmn1ropr10001bzg3ookyhnvc', region: '포천', file: '포천_풀스캔' },
  { id: 'cmn1roprl0009bzg3hlzq8swn', region: '양주', file: '양주_풀스캔' },
]

function fetchNaver(bizName, region) {
  return new Promise((resolve) => {
    const url = 'https://search.naver.com/search.naver?query=' + encodeURIComponent(bizName + ' ' + region) + '&where=place'
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
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
  let { html, status } = await fetchNaver(bizName, region)
  if (html.length < 100000 || status !== 200) {
    await new Promise(r => setTimeout(r, 5000))
    const retry = await fetchNaver(bizName, region)
    html = retry.html; status = retry.status
  }
  if (html.length < 100000) return null
  const shortName = bizName.slice(0, Math.min(4, bizName.length))
  return html.includes(shortName) && html.length > 350000
}

function makeRow(c) {
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

async function verifyJob({ id, region, file }) {
  const contacts = await prisma.contact.findMany({
    where: { jobId: id, sources: { contains: 'KAKAO' } },
  })

  console.log(`\n[${region}] 네이버 검증 시작: ${contacts.length}개`)
  let active = 0, closed = 0, unknown = 0

  for (let i = 0; i < contacts.length; i++) {
    if (i > 0 && i % 20 === 0) {
      process.stdout.write(`\n[배치 휴식...]\n`)
      await new Promise(r => setTimeout(r, 10000))
    }
    const c = contacts[i]
    const cleanName = c.bizName.replace('[폐업의심] ', '')
    const exists = await checkBusiness(cleanName, region)
    if (exists === false) {
      await prisma.contact.update({ where: { id: c.id }, data: { bizName: `[폐업의심] ${cleanName}` } })
      closed++
    } else if (exists === true) { active++ } else { unknown++ }
    process.stdout.write(`\r[${region}] [${i+1}/${contacts.length}] 영업중:${active} 폐업의심:${closed} 판단불가:${unknown}`)
    await new Promise(r => setTimeout(r, 1200))
  }

  console.log(`\n[${region}] 검증 완료 — 영업중:${active} 폐업의심:${closed} 판단불가:${unknown}`)

  const all = await prisma.contact.findMany({ where: { jobId: id }, orderBy: { category: 'asc' } })
  const header = '\uFEFF업체명,업종,전화번호,인스타/톡톡,이메일,출처,원본URL\n'

  fs.writeFileSync(`C:/Users/lian1/Desktop/${file}_네이버검증완료.csv`, header + all.map(makeRow).join('\n'), 'utf8')
  const activeOnly = all.filter(c => !c.bizName.startsWith('[폐업의심]'))
  fs.writeFileSync(`C:/Users/lian1/Desktop/${file}_영업중만.csv`, header + activeOnly.map(makeRow).join('\n'), 'utf8')
  console.log(`[${region}] CSV 저장 — 전체:${all.length}개 / 영업중:${activeOnly.length}개`)
}

async function main() {
  for (const job of JOBS) {
    await verifyJob(job)
  }
  console.log('\n\n전체 완료!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
