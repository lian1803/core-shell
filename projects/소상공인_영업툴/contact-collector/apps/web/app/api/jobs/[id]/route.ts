import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = await prisma.job.findFirst({
    where: { id: params.id },
    include: {
      platformStats: true,
      _count: {
        select: { results: true },
      },
    },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({ job })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = await prisma.job.findFirst({
    where: { id: params.id },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  await prisma.job.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
