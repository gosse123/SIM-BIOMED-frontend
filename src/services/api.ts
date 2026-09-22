import axios, { type AxiosRequestConfig } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import type { LoginResponse, User } from '@/types/auth'
import type { DemandeAcces, Notification } from '@/types/demandes'
import { network } from './network'
import { addToSyncQueue, getSyncQueue, updateSyncEntry, removeSyncEntry } from './db'
import { addPendingEntity, setReconciledId, getPendingEntityByOfflineId, removePendingEntity } from './db'
import { put } from './db'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Add offline ID for idempotent mutations (only if not already set by sync queue)
  if (config.method && ['post', 'patch', 'put', 'delete'].includes(config.method)) {
    config.headers['X-Offline-Id'] = config.headers['X-Offline-Id'] ?? uuidv4()
  }
  return config
})

// Response interceptor: handle 401 + refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh/', { refresh: refreshToken })
          localStorage.setItem('access_token', data.access)
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          // Preserve X-Offline-Id on retry
          return api(originalRequest)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

/**
 * Offline-aware API call.
 * If offline and mutation, queues the operation and returns a mock response.
 */
export async function offlineAwareRequest<T>(
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<{ data: T; offline?: boolean; offlineId?: string }> {
  const isWrite = ['post', 'patch', 'put', 'delete'].includes(method)

  // GET requests: always try network, fallback to caller
  if (!isWrite || network.isOnline()) {
    return api[method](url, data, config) as Promise<{ data: T }>
  }

  // Offline mutation: queue it
  const offlineId = uuidv4()
  const tempId = Math.floor(Math.random() * -1000) - 1
  const entry = {
    id: offlineId,
    method: method.toUpperCase() as 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    url,
    body: data,
    createdAt: Date.now(),
  }

  await addToSyncQueue(entry)

  const mockData = {
    id: tempId,
    offlineId,
    ...((data as Record<string, unknown>) || {}),
    created_at: new Date().toISOString(),
    _offline: true,
  } as unknown as T

  // Persist temp entity for reconciliation after sync
  const store = url.includes('/pannes/') ? 'pannes'
    : url.includes('/interventions/') ? 'interventions'
    : url.includes('/equipment/') ? 'equipment'
    : null

  if (store) {
    const cacheKey = `${store.replace(/s$/, '')}-${tempId}`
    await put(store as 'pannes', cacheKey, mockData, Infinity)
    await addPendingEntity({
      tempId,
      offlineId,
      store: store as 'pannes',
      cacheKey,
      entity: mockData,
      createdAt: Date.now(),
    })
  }

  return {
    data: mockData,
    offline: true,
    offlineId,
  }
}

/**
 * Process the sync queue when back online.
 * Returns results of each synced operation.
 */
export async function processSyncQueue(): Promise<
  Array<{ id: string; status: 'synced' | 'error'; error?: string }>
> {
  if (!network.isOnline()) return []

  const queue = await getSyncQueue()
  const results: Array<{ id: string; status: 'synced' | 'error'; error?: string }> = []

  for (const entry of queue) {
    if (entry.syncStatus === 'synced') {
      await removeSyncEntry(entry.id)
      continue
    }

    try {
      await updateSyncEntry({ ...entry, syncStatus: 'syncing' })

      const response = await api({
        method: entry.method.toLowerCase(),
        url: entry.url,
        data: entry.body,
        headers: {
          ...entry.headers,
          'X-Offline-Id': entry.id,
        },
      })

      // Reconcile: find the temp entity by offlineId and replace with server response
      const pending = await getPendingEntityByOfflineId(entry.id)
      if (pending) {
        // Replace temp cache entry with real server data
        await put(pending.store, pending.cacheKey, response.data, Infinity)
        // Store tempId → realId mapping for dependent operations
        await setReconciledId(pending.tempId, response.data.id)
        await removePendingEntity(pending.tempId)
      }

      await updateSyncEntry({
        ...entry,
        syncStatus: 'synced',
        syncedAt: Date.now(),
      })
      await removeSyncEntry(entry.id)

      results.push({ id: entry.id, status: 'synced' })
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      await updateSyncEntry({
        ...entry,
        syncStatus: 'error',
        retryCount: entry.retryCount + 1,
        error: errorMsg,
      })
      results.push({ id: entry.id, status: 'error', error: errorMsg })
    }
  }

  return results
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login/', { username, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    return data
  },

  register: async (userData: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
    role?: string
  }): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/register/', userData)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    return data
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me/')
    return data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },
}

export const usersApi = {
  list: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>('/users/')
    return data
  },

  get: async (id: number): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}/`)
    return data
  },

  create: async (userData: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
    role: string
    etablissement?: number
  }): Promise<User> => {
    const { data } = await api.post<User>('/users/', userData)
    return data
  },

  update: async (id: number, userData: Partial<User>): Promise<User> => {
    const { data } = await api.patch<User>(`/users/${id}/`, userData)
    return data
  },

  deactivate: async (id: number): Promise<void> => {
    await api.post(`/users/${id}/deactivate/`)
  },

  setRole: async (id: number, role: string): Promise<void> => {
    await api.post(`/users/${id}/set-role/`, { role })
  },
}

export const demandesApi = {
  submit: async (data: {
    nom_complet: string
    email: string
    role_souhaite: string
    justification: string
    service?: string
  }): Promise<{ detail: string; id: number }> => {
    const { data: resp } = await api.post('/auth/request-access/', data)
    return resp
  },

  list: async (statut?: string): Promise<DemandeAcces[]> => {
    const params = statut ? { statut } : {}
    const { data } = await api.get('/demandes/', { params })
    return data
  },

  approve: async (id: number): Promise<{ detail: string; user: User }> => {
    const { data } = await api.post(`/demandes/${id}/approve/`)
    return data
  },

  reject: async (id: number, motif?: string): Promise<{ detail: string }> => {
    const { data } = await api.post(`/demandes/${id}/reject/`, { motif: motif || '' })
    return data
  },
}

export const notificationsApi = {
  list: async (): Promise<{ notifications: Notification[]; non_lues: number }> => {
    const { data } = await api.get('/notifications/')
    return data
  },

  markRead: async (id: number): Promise<void> => {
    await api.post(`/notifications/${id}/read/`)
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/read-all/')
  },
}

export const profileApi = {
  checkComplete: async (): Promise<{ profil_complete: boolean }> => {
    const { data } = await api.get('/auth/profile-complete/')
    return data
  },

  complete: async (data: { matricule: string; etablissement: number; service?: string; new_password: string }): Promise<{ detail: string; user: User }> => {
    const { data: resp } = await api.post('/auth/complete-profile/', data)
    return resp
  },

  getEtablissements: async (): Promise<Array<{ id: number; nom: string }>> => {
    const { data } = await api.get('/auth/etablissements/')
    return data
  },
}

export default api
