'use client'

import { useEffect, useState } from 'react'

interface Contact {
  id: string
  bizName: string
  category: string | null
  phone: string | null
  kakao: string | null
  email: string | null
  sources: string[]
}

interface JobResultTableProps {
  jobId: string
}

export function JobResultTable({ jobId }: JobResultTableProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/results?page=${page}`)
        if (res.ok) {
          const data = await res.json()
          setContacts(data.contacts)
          setTotalPages(data.pagination.totalPages)
        }
      } catch (err) {
        console.error('Failed to fetch results:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [jobId, page])

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-slate-500">
        결과 불러오는 중...
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-slate-500">
        아직 수집된 결과가 없습니다
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
              업체명
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
              업종
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
              전화번호
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
              카카오톡
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
              이메일
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-medium text-slate-900">
                {contact.bizName}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {contact.category || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-900">
                {contact.phone || '-'}
              </td>
              <td className="px-4 py-3 text-sm">
                {contact.kakao ? (
                  <a
                    href={contact.kakao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    카카오톡
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-primary hover:underline"
                  >
                    {contact.email}
                  </a>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 p-4 border-t">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-1">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
