import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 50

  const job = await prisma.job.findFirst({
    where: { id: params.id },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where: { jobId: params.id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { collectedAt: 'desc' },
    }),
    prisma.contact.count({ where: { jobId: params.id } }),
  ])

  return NextResponse.json({
    contacts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
