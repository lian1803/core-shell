'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('유효하지 않은 링크입니다.')
      return
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success')
        setMessage('이메일 인증이 완료되었습니다!')
        setTimeout(() => router.push('/chat'), 2000)
      })
      .catch(() => {
        setStatus('error')
        setMessage('인증 링크가 만료되었거나 유효하지 않습니다.')
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">인증 중...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{message}</h2>
            <p className="text-gray-500">잠시 후 대시보드로 이동합니다...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{message}</h2>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              로그인으로 이동
            </button>
          </>
        )}
      </div>
    </div>
  )
}
