import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '@/types/auth'
import { authApi } from '@/services/api'
import { purgeAllLocalData } from '@/services/db'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  register: (data: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
  }) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password)
    setUser(response.user)
  }

  const register = async (data: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
  }) => {
    const response = await authApi.register(data)
    setUser(response.user)
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  const logout = () => {
    authApi.logout()
    // Purge du stockage local et de la file de sync pour éviter toute
    // fuite de données entre utilisateurs (règle §6 de la revue hors-ligne)
    purgeAllLocalData().catch(() => { /* silencieux : purge au mieux */ })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
