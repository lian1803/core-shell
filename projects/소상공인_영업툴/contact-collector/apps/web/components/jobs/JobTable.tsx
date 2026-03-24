import Link from 'next/link'
import { JobStatusBadge } from './JobStatusBadge'

interface Job {
  id: string
  name: string
  keyword: string
  status: string
  validCount: number
  createdAt: Date
  _count?: { results: number }
}

interface JobTableProps {
  jobs: Job[]
}

export function JobTable({ jobs }: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-slate-500">
        아직 수집 작업이 없습니다. "새 작업"을 클릭하여 시작하세요.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
              작업명
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
              키워드
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
              상태
            </th>
            <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">
              수집 건수
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
              생성일
            </th>
            <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">
              액션
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-medium text-slate-900">
                {job.name}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{job.keyword}</td>
              <td className="px-4 py-3">
                <JobStatusBadge status={job.status} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-900 text-right">
                {job.validCount || job._count?.results || 0}건
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {new Date(job.createdAt).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-primary hover:text-primary-700 text-sm"
                >
                  상세
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
