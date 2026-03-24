import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { CreateJobInput } from '@contact-collector/shared'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  const where: any = {}
  if (status && status !== 'ALL') {
    where.status = status
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.job.count({ where }),
  ])

  return NextResponse.json({
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const body: CreateJobInput = await request.json()
  const { keyword, region, limitCount = 100, platforms, name } = body

  if (!keyword || !platforms || platforms.length === 0) {
    return NextResponse.json(
      { error: 'keyword and platforms are required' },
      { status: 400 }
    )
  }

  // 첫 번째 유저 사용 (로그인 없이)
  const user = await prisma.user.findFirst()
  if (!user) {
    return NextResponse.json({ error: 'No user found' }, { status: 500 })
  }

  const job = await prisma.job.create({
    data: {
      name: name || `${keyword} ${new Date().toLocaleDateString('ko-KR')}`,
      keyword,
      region,
      limitCount: Math.min(limitCount, 500),
      platforms: JSON.stringify(platforms),
      userId: user.id,
    },
  })

  await prisma.platformStat.createMany({
    data: platforms.map((platform) => ({
      jobId: job.id,
      platform: platform as any,
      status: 'PENDING',
      collected: 0,
    })),
  })

  return NextResponse.json({ job }, { status: 201 })
}
