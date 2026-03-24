'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge'
import { JobResultTable } from '@/components/jobs/JobResultTable'

interface PlatformStat {
  platform: string
  status: string
  collected: number
  error?: string
}

interface JobDetail {
  id: string
  name: string
  keyword: string
  region: string | null
  status: string
  totalRaw: number
  filteredCount: number
  validCount: number
  errorMessage: string | null
  createdAt: string
  platformStats: PlatformStat[]
}

const PLATFORM_ICONS: Record<string, string> = {
  GOOGLE: '🔍',
  NAVER: '📝',
  DAANGN: '🥕',
  INSTAGRAM: '📷',
}

const PLATFORM_NAMES: Record<string, string> = {
  GOOGLE: '구글 비즈니스',
  NAVER: '네이버 블로그',
  DAANGN: '당근마켓',
  INSTAGRAM: '인스타그램',
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // Polling for status updates
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`)
        if (res.ok) {
          const data = await res.json()
          setJob(data.job)
        }
      } catch (err) {
        console.error('Failed to fetch job:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()

    // Poll every 5 seconds if running
    const interval = setInterval(() => {
      if (job?.status === 'RUNNING' || job?.status === 'PENDING') {
        fetchJob()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [jobId, job?.status])

  const handleDelete = async () => {
    if (!confirm('정말 이 작업을 삭제하시겠습니까?')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/')
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleRetry = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' })
      if (res.ok) {
        // Refresh job data
        const data = await fetch(`/api/jobs/${jobId}`).then((r) => r.json())
        setJob(data.job)
      }
    } catch (err) {
      console.error('Failed to retry:', err)
    }
  }

  const handleDownload = async () => {
    window.location.href = `/api/jobs/${jobId}/download`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-32 bg-slate-200 rounded" />
          </div>
        </main>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-slate-500">작업을 찾을 수 없습니다</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{job.name}</h1>
            <p className="text-slate-500 mt-1">
              키워드: {job.keyword}
              {job.region && ` | 지역: ${job.region}`}
            </p>
          </div>
          <JobStatusBadge status={job.status} />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-slate-500">전체 수집</div>
            <div className="text-2xl font-bold text-slate-900">{job.totalRaw}건</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-slate-500">050 필터링</div>
            <div className="text-2xl font-bold text-amber-600">{job.filteredCount}건</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-slate-500">최종 유효</div>
            <div className="text-2xl font-bold text-green-600">{job.validCount}건</div>
          </div>
        </div>

        {/* Platform stats */}
        <div className="bg-white rounded-lg p-4 mb-6">
          <h2 className="font-medium text-slate-900 mb-3">플랫폼별 현황</h2>
          <div className="grid grid-cols-4 gap-3">
            {job.platformStats.map((stat) => (
              <div
                key={stat.platform}
                className={`p-3 rounded-md ${
                  stat.status === 'SUCCESS'
                    ? 'bg-green-50'
                    : stat.status === 'RUNNING'
                    ? 'bg-blue-50'
                    : stat.status === 'FAILED'
                    ? 'bg-red-50'
                    : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{PLATFORM_ICONS[stat.platform]}</span>
                  <span className="text-sm font-medium">
                    {PLATFORM_NAMES[stat.platform]}
                  </span>
                </div>
                <div className="text-lg font-bold">
                  {stat.status === 'RUNNING' ? '⏳' : stat.status === 'FAILED' ? '❌' : '✅'}{' '}
                  {stat.collected}건
                </div>
                {stat.error && (
                  <div className="text-xs text-red-600 mt-1">{stat.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error message */}
        {job.errorMessage && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            <strong>오류:</strong> {job.errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          {job.status === 'COMPLETED' && (
            <button
              onClick={handleDownload}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              📥 CSV 다운로드
            </button>
          )}
          {job.status === 'FAILED' && (
            <button
              onClick={handleRetry}
              className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600"
            >
              🔄 재시도
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="border border-red-300 text-red-600 px-4 py-2 rounded-md hover:bg-red-50"
          >
            🗑️ 삭제
          </button>
        </div>

        {/* Results table */}
        {(job.status === 'COMPLETED' || job.status === 'RUNNING') && (
          <JobResultTable jobId={jobId} />
        )}
      </main>
    </div>
  )
}
