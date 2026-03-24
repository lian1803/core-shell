'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

const STEPS = ['워크스페이스', 'PG 설정', '위젯 설치', '완료']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [workspace, setWorkspace] = useState<any>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const [pgForm, setPgForm] = useState({ pgProvider: 'KAKAOPAY', apiKey: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scriptCode, setScriptCode] = useState('')

  async function createWorkspace() {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/workspace', { name: workspaceName })
      setWorkspace(res.data.workspace)
      const scriptRes = await api.get(`/widget/${res.data.workspace.id}/script`)
      setScriptCode(scriptRes.data.script)
      setStep(1)
    } catch (err: any) {
      setError(err.response?.data?.error || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function savePgKey() {
    setError('')
    setLoading(true)
    try {
      await api.patch('/workspace/pg', pgForm)
      setStep(2)
    } catch (err: any) {
      setError(err.response?.data?.error || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function skipPg() {
    setStep(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl">
        {/* Steps */}
        <div className="flex border-b border-gray-100">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 py-4 text-center text-xs font-semibold transition ${
                i === step ? 'text-indigo-600 border-b-2 border-indigo-600' :
                i < step ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {i < step ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>

        <div className="p-8">
          {/* Step 0: Workspace name */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">워크스페이스 만들기</h2>
                <p className="text-gray-500 mt-1">비즈니스 이름을 입력해주세요</p>
              </div>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="예: 리안 스킨케어샵"
                onKeyDown={(e) => e.key === 'Enter' && workspaceName && createWorkspace()}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={createWorkspace}
                disabled={!workspaceName || loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? '생성 중...' : '다음'}
              </button>
            </div>
          )}

          {/* Step 1: PG Key */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">PG API Key 등록</h2>
                <p className="text-gray-500 mt-1">결제 링크 발송을 위해 PG 키를 등록하세요 (나중에 설정 가능)</p>
              </div>
              <div className="flex gap-3">
                {(['KAKAOPAY', 'TOSS'] as const).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setPgForm({ ...pgForm, pgProvider: pg })}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                      pgForm.pgProvider === pg
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {pg === 'KAKAOPAY' ? '카카오페이' : '토스페이먼츠'}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={pgForm.apiKey}
                onChange={(e) => setPgForm({ ...pgForm, apiKey: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                placeholder="Secret Key 입력..."
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={skipPg}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  나중에 설정
                </button>
                <button
                  onClick={savePgKey}
                  disabled={!pgForm.apiKey || loading}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {loading ? '저장 중...' : '저장 후 다음'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Widget install */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">위젯 설치</h2>
                <p className="text-gray-500 mt-1">아래 코드를 사이트 {'<head>'} 태그 안에 붙여넣으세요</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-green-400 text-xs whitespace-pre-wrap font-mono">{scriptCode}</pre>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(scriptCode)}
                className="w-full py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition"
              >
                코드 복사
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                설치 완료
              </button>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">설정 완료!</h2>
                <p className="text-gray-500 mt-2">이제 고객들과 실시간으로 채팅할 수 있어요</p>
              </div>
              <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl">
                완전 무료로 이용 중입니다. 모든 기능을 제한 없이 사용하세요!
              </div>
              <button
                onClick={() => router.push('/chat')}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                채팅 대시보드 바로가기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
