'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export default function PgSettingsPage() {
  const [workspace, setWorkspace] = useState<any>(null)
  const [form, setForm] = useState({ pgProvider: 'KAKAOPAY', apiKey: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    api.get('/workspace')
      .then((res) => {
        setWorkspace(res.data.workspace)
        if (res.data.workspace.pgProvider) {
          setForm((f) => ({ ...f, pgProvider: res.data.workspace.pgProvider }))
        }
      })
      .finally(() => setPageLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)
    try {
      await api.patch('/workspace/pg', form)
      setSuccess(true)
      setForm((f) => ({ ...f, apiKey: '' }))
    } catch (err: any) {
      setError(err.response?.data?.error || '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">PG 설정</h1>
        <p className="text-gray-500 mt-1">결제 링크 발송을 위한 PG API Key를 등록합니다</p>
      </div>

      {pageLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-100 p-6">
          {workspace?.pgProvider && workspace.pgProvider !== 'NONE' && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl">
              현재 등록된 PG: {workspace.pgProvider === 'KAKAOPAY' ? '카카오페이' : '토스페이먼츠'} (키 변경 시 새 키 입력)
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">결제 수단 선택</label>
            <div className="flex gap-3">
              {(['KAKAOPAY', 'TOSS'] as const).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setForm({ ...form, pgProvider: pg })}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                    form.pgProvider === pg
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {pg === 'KAKAOPAY' ? '카카오페이' : '토스페이먼츠'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.pgProvider === 'KAKAOPAY' ? '카카오페이 Secret Key' : '토스페이먼츠 Secret Key'}
            </label>
            <input
              type="password"
              required
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              placeholder="Secret Key 입력..."
            />
            <p className="text-xs text-gray-400 mt-1">API Key는 AES-256 암호화하여 안전하게 저장됩니다</p>
          </div>

          {success && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl">PG Key가 성공적으로 저장되었습니다.</div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !form.apiKey}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? '저장 중...' : 'API Key 저장'}
          </button>
        </form>
      )}
    </div>
  )
}
