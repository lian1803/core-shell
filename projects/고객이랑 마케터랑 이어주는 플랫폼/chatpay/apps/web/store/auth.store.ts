import { create } from 'zustand'

interface User {
  id: string
  email: string
  isEmailVerified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  initFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatpay_token', token)
      localStorage.setItem('chatpay_user', JSON.stringify(user))
    }
    set({ user, token, isLoading: false })
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatpay_token')
      localStorage.removeItem('chatpay_user')
    }
    set({ user: null, token: null, isLoading: false })
  },

  setLoading: (isLoading) => set({ isLoading }),

  initFromStorage: () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('chatpay_token')
    const userStr = localStorage.getItem('chatpay_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ user, token, isLoading: false })
      } catch {
        set({ isLoading: false })
      }
    } else {
      set({ isLoading: false })
    }
  },
}))
