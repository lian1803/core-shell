import { PrismaClient } from '@prisma/client'
import { chromium } from 'playwright'
import type { ScraperResult } from '@contact-collector/shared'
import { GoogleScraper } from './scrapers/google.scraper'
import { NaverScraper } from './scrapers/naver.scraper'
import { DaangnScraper } from './scrapers/daangn.scraper'
import { InstagramScraper } from './scrapers/instagram.scraper'
import { KakaoScraper } from './scrapers/kakao.scraper'
import { filterPhone, is010Number } from './filters/phone.filter'
import { deduplicateContacts } from './filters/duplicate.filter'
import { classifyCategory } from './classifiers/category.classifier'

const prisma = new PrismaClient()

const scrapers: Record<string, any> = {
  GOOGLE: GoogleScraper,
  NAVER: NaverScraper,
  DAANGN: DaangnScraper,
  INSTAGRAM: InstagramScraper,
  KAKAO: KakaoScraper,
}

const RATE_LIMITS: Record<string, number> = {
  GOOGLE: 2000,
  NAVER: 3000,
  DAANGN: 2000,
  INSTAGRAM: 5000,
  KAKAO: 1000,
}

async function processJob(jobId: string, keyword: string, region: string | null, limitCount: number, platforms: string[]) {
  console.log(`Starting job ${jobId}: ${keyword}`)

  // Update job status
  await prisma.job.update({
    where: { id: jobId },
    data: { status: 'RUNNING', startedAt: new Date() },
  })

  const allResults: ScraperResult[] = []
  let totalRaw = 0
  let filteredCount = 0

  try {
    const browser = await chromium.launch({ headless: true })

    for (const platform of platforms) {
      const scraper = scrapers[platform]
      if (!scraper) {
        console.log(`Unknown platform: ${platform}`)
        continue
      }

      // Update platform stat
      await prisma.platformStat.updateMany({
        where: { jobId, platform: platform as any },
        data: { status: 'RUNNING' },
      })

      try {
        const delay = RATE_LIMITS[platform]
        const results = await scraper(browser, { keyword, region, limitCount, delay })

        totalRaw += results.length

        // 010 번호 OR 인스타/톡톡 채널이 있는 것만 통과
        const validResults = results.filter((r: ScraperResult) => {
          const has010 = r.phone ? is010Number(r.phone) : false
          const hasChannel = !!r.kakao  // 인스타 URL 또는 네이버 톡톡 URL
          if (!has010 && !hasChannel) {
            filteredCount++
            return false
          }
          // phone이 010이 아닌 지역번호면 제거
          if (r.phone && !has010) {
            r.phone = undefined
          }
          return true
        })

        allResults.push(...validResults)

        // Update platform stat
        await prisma.platformStat.updateMany({
          where: { jobId, platform: platform as any },
          data: { status: 'SUCCESS', collected: validResults.length },
        })

        console.log(`${platform}: collected ${validResults.length} contacts`)
      } catch (error: any) {
        console.error(`${platform} scraper error:`, error.message)

        await prisma.platformStat.updateMany({
          where: { jobId, platform: platform as any },
          data: { status: 'FAILED', error: error.message.slice(0, 200) },
        })

        await prisma.jobError.create({
          data: {
            jobId,
            platform: platform as any,
            message: error.message,
            stack: error.stack,
          },
        })
      }
    }

    await browser.close()

    // Deduplicate
    const deduped = deduplicateContacts(allResults)

    // Save contacts
    for (const contact of deduped) {
      const category = classifyCategory(contact.bizName, contact.category)

      await prisma.contact.create({
        data: {
          jobId,
          bizName: contact.bizName,
          category,
          phone: contact.phone ? filterPhone(contact.phone) : null,
          kakao: contact.kakao || null,
          email: contact.email || null,
          sources: JSON.stringify([contact.source]),
          rawSources: JSON.stringify([contact.rawSource]),
        },
      })
    }

    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalRaw,
        filteredCount,
        validCount: deduped.length,
      },
    })

    console.log(`Job ${jobId} completed: ${deduped.length} valid contacts`)
  } catch (error: any) {
    console.error(`Job ${jobId} failed:`, error)

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error.message,
      },
    })
  }
}

async function pollJobs() {
  const job = await prisma.job.findFirst({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  })

  if (job) {
    const platforms = JSON.parse(job.platforms as string) as string[]
    await processJob(job.id, job.keyword, job.region, job.limitCount, platforms)
  }
}

setInterval(pollJobs, 2000)
console.log('Worker polling started...')
