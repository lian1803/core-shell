import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = await prisma.job.findFirst({
    where: { id: params.id },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status !== 'FAILED') {
    return NextResponse.json(
      { error: 'Only failed jobs can be retried' },
      { status: 400 }
    )
  }

  // Reset job status → 워커가 폴링해서 자동 실행
  await prisma.job.update({
    where: { id: params.id },
    data: {
      status: 'PENDING',
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    },
  })

  await prisma.platformStat.updateMany({
    where: { jobId: params.id },
    data: { status: 'PENDING', collected: 0, error: null },
  })

  return NextResponse.json({ success: true })
}
