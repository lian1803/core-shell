import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { JobTable } from '@/components/jobs/JobTable'
import Link from 'next/link'

export default async function HomePage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const status = searchParams.status || 'ALL'

  const jobs = await prisma.job.findMany({
    where: {
      ...(status !== 'ALL' && { status }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      _count: { select: { results: true } },
    },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">수집 작업</h1>
          <Link
            href="/jobs/new"
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            + 새 작업
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['ALL', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'].map((s) => (
            <Link
              key={s}
              href={`/?status=${s}`}
              className={`px-3 py-1 rounded-md text-sm ${
                status === s
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s === 'ALL'
                ? '전체'
                : s === 'PENDING'
                ? '대기'
                : s === 'RUNNING'
                ? '진행중'
                : s === 'COMPLETED'
                ? '완료'
                : '실패'}
            </Link>
          ))}
        </div>

        <JobTable jobs={jobs} />
      </main>
    </div>
  )
}
