import { useState, useEffect, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import type { User } from '@/types/auth'
import { authApi } from '@/services/api'
import { purgeAllLocalData, getSyncQueue } from '@/services/db'
import { AuthContext } from './AuthContext'

const CACHED_USER_KEY = 'cached_user'

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const persistUser = (next: User | null) => {
    setUser(next)
    if (next) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(next))
    } else {
      localStorage.removeItem(CACHED_USER_KEY)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then(persistUser)
      .catch((err: unknown) => {
        // Purge uniquement sur refus d'authentification : une erreur réseau
        // ou un serveur en démarrage ne doit pas déconnecter l'utilisateur.
        const status = isAxiosError(err) ? err.response?.status : undefined
        if (status === 401 || status === 403) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          persistUser(null)
        } else {
          const cached = readCachedUser()
          if (cached) setUser(cached)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password)
    persistUser(response.user)
  }

  const register = async (data: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
  }) => {
    const response = await authApi.register(data)
    persistUser(response.user)
  }

  const updateUser = (updatedUser: User) => {
    persistUser(updatedUser)
  }

  const logout = async () => {
    // Aucune purge silencieuse : on prévient si des opérations hors ligne
    // n'ont pas encore été synchronisées.
    try {
      const queue = await getSyncQueue()
      const pending = queue.filter((e) => e.syncStatus !== 'synced').length
      if (pending > 0) {
        const confirmed = window.confirm(
          `${pending} opération${pending > 1 ? 's' : ''} hors ligne en attente de synchronisation ` +
            `sera${pending > 1 ? 'nt' : ''} définitivement perdue${pending > 1 ? 's' : ''}.\n\n` +
            'Se déconnecter quand même ?',
        )
        if (!confirmed) return
      }
    } catch {
      // Impossible de lire la file : on déconnecte sans bloquer.
    }
    authApi.logout()
    persistUser(null)
    purgeAllLocalData().catch(() => { /* silencieux : purge au mieux */ })
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
