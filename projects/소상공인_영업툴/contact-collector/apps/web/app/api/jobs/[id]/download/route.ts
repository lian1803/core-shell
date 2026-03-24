import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stringify } from 'csv-stringify'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = await prisma.job.findFirst({
    where: { id: params.id },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const contacts = await prisma.contact.findMany({
    where: { jobId: params.id },
    orderBy: { collectedAt: 'desc' },
  })

  const csvData = contacts.map((c: { bizName: string; category: string | null; phone: string | null; kakao: string | null; email: string | null; sources: string; rawSources: string }) => {
    const sources = JSON.parse(c.sources) as string[]
    const rawSources = JSON.parse(c.rawSources) as string[]
    return {
      업체명: c.bizName,
      업종: c.category || '',
      전화번호: c.phone || '',
      '인스타/톡톡': c.kakao || '',
      이메일: c.email || '',
      출처: sources.join(', '),
      원본URL: rawSources[0] || '',
    }
  })

  const columns = ['업체명', '업종', '전화번호', '인스타/톡톡', '이메일', '출처', '원본URL']

  const csvContent = await new Promise<string>((resolve, reject) => {
    stringify(csvData, { header: true, columns }, (err, output) => {
      if (err) reject(err)
      else resolve(output)
    })
  })

  return new NextResponse('\uFEFF' + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="contacts_${job.name.replace(/\s+/g, '_')}.csv"`,
    },
  })
}
