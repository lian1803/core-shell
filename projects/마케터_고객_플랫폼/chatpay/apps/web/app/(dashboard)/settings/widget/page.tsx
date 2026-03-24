'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Copy, Check } from 'lucide-react'

export default function WidgetSettingsPage() {
  const [workspace, setWorkspace] = useState<any>(null)
  const [script, setScript] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/workspace')
      .then(async (res) => {
        setWorkspace(res.data.workspace)
        const scriptRes = await api.get(`/widget/${res.data.workspace.id}/script`)
        setScript(scriptRes.data.script)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function copyScript() {
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">위젯 설정</h1>
        <p className="text-gray-500 mt-1">사이트에 채팅 위젯을 삽입하는 코드를 발급합니다</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !workspace ? (
        <div className="bg-yellow-50 text-yellow-700 rounded-xl p-4 text-sm">
          워크스페이스를 먼저 생성해주세요. 온보딩을 완료해주세요.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-2">위젯 설치 코드</h2>
            <p className="text-sm text-gray-500 mb-4">
              아래 코드를 사이트의 {'<head>'} 태그 안에 붙여넣으세요.
            </p>
            <div className="relative bg-gray-900 rounded-xl p-4 overflow-x-auto">
              <pre className="text-green-400 text-xs whitespace-pre-wrap font-mono pr-10">{script}</pre>
              <button
                onClick={copyScript}
                className="absolute top-3 right-3 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-5">
            <h3 className="font-semibold text-indigo-800 mb-2">설치 확인 방법</h3>
            <ol className="text-sm text-indigo-700 space-y-1 list-decimal list-inside">
              <li>코드를 복사하여 사이트 HTML {'<head>'} 태그에 붙여넣기</li>
              <li>사이트를 새로고침</li>
              <li>오른쪽 하단에 채팅 버튼이 나타나면 설치 성공!</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
