import axios, { type AxiosRequestConfig } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import type { LoginResponse, User } from '@/types/auth'
import type { DemandeAcces, Notification } from '@/types/demandes'
import { isServerUnavailable } from '@/utils/errors'
import { network } from './network'
import { addToSyncQueue, getSyncQueue, updateSyncEntry, removeSyncEntry } from './db'
import { addPendingEntity, setReconciledId, getPendingEntityByOfflineId, removePendingEntity, getAllReconciledIds } from './db'
import { put } from './db'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

/**
 * Le plan gratuit d'hébergement met l'API en veille après ~15 min d'inactivité :
 * le premier appel reçoit un 502 (proxy) pendant le réveil (~30-60 s).
 * On réessaie avec backoff, et on réveille l'API en appelant son origine
 * directement (CORS ouvert) — le proxy nginx ne déclenche pas toujours le réveil.
 */
const READ_RETRY_DELAYS = [3000, 8000, 15000, 30000]
const WRITE_RETRY_DELAYS = [2000, 5000]
const WAKE_EVENT = 'api:server-waking'
let lastWakeAt = 0
let apiOriginPromise: Promise<string | null> | null = null

/**
 * Origine réelle de l'API. Priorité à VITE_API_ORIGIN (build), sinon on la
 * demande à nginx (`/api/origin`, injectée à l'exécution) : les variables
 * d'environnement ne sont pas visibles lors des builds Docker.
 */
function getApiOrigin(): Promise<string | null> {
  const fromBuild = import.meta.env.VITE_API_ORIGIN as string | undefined
  if (fromBuild) return Promise.resolve(fromBuild)
  if (!apiOriginPromise) {
    apiOriginPromise = fetch('/api/origin', { cache: 'no-store' })
      .then((r) => (r.ok ? r.text() : ''))
      .then((text) => {
        const origin = text.trim().replace(/\/+$/, '')
        return /^https?:\/\/.+/.test(origin) ? origin : null
      })
      .catch(() => null)
      .then((origin) => {
        // échec → on oublie pour retenter au prochain réveil
        if (!origin) apiOriginPromise = null
        return origin
      })
  }
  return apiOriginPromise
}

function wakeServer() {
  const now = Date.now()
  if (now - lastWakeAt < 15000) return
  lastWakeAt = now
  // événement synchrone : le bandeau « réveil » s'affiche tout de suite
  window.dispatchEvent(new Event(WAKE_EVENT))
  void (async () => {
    const origin = await getApiOrigin()
    if (!origin) return
    await fetch(`${origin}/api/healthz/`, { headers: { Accept: 'application/json' } }).catch(
      () => {
        /* le réveil est best-effort : les retries suivront */
      },
    )
  })()
}

export { WAKE_EVENT }

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

// Response interceptor: 401 + refresh, et réveil/retries si le serveur est indisponible
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      originalRequest &&
      isServerUnavailable(error) &&
      network.isOnline()
    ) {
      const isWrite = ['post', 'patch', 'put', 'delete'].includes(
        (originalRequest.method ?? '').toLowerCase(),
      )
      const delays = isWrite ? WRITE_RETRY_DELAYS : READ_RETRY_DELAYS
      const attempt = originalRequest._serverRetries ?? 0
      if (attempt < delays.length) {
        originalRequest._serverRetries = attempt + 1
        if (attempt === 0) wakeServer()
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
        return api(originalRequest)
      }
    }
    if (originalRequest && error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh/', { refresh: refreshToken })
          localStorage.setItem('access_token', data.access)
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          // Preserve X-Offline-Id on retry
          return api(originalRequest)
        } catch (refreshErr: unknown) {
          if (isServerUnavailable(refreshErr)) {
            // Serveur injoignable : ce n'est pas un vrai refus d'authentification,
            // on ne purge pas les jetons (sinon déconnexion à tort hors ligne).
            return Promise.reject(
              new Error('Serveur injoignable pendant le rafraîchissement de la session.'),
            )
          }
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

  // GET : toujours réseau, l'appelant gère le fallback
  if (!isWrite) {
    return api[method](url, data, config) as Promise<{ data: T }>
  }

  // Écriture en ligne : on tente le serveur. Si le serveur est injoignable
  // (API en veille, coupure, proxy 502) alors que la carte réseau est active,
  // on met en file au lieu de perdre la saisie de l'utilisateur.
  if (network.isOnline()) {
    try {
      return await (api[method](url, data, config) as Promise<{ data: T }>)
    } catch (err) {
      if (!isServerUnavailable(err)) throw err
    }
  }

  // Hors ligne ou serveur injoignable : on met en file
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
 * Réécrit les références aux identifiants temporaires (négatifs) remplacées
 * par des identifiants réels après réconciliation — URL et corps des
 * entrées dépendantes (règle §7 de la revue hors-ligne).
 */
export async function rewriteDependentEntry(
  entry: { url: string; body?: unknown }
): Promise<{ url: string; body?: unknown }> {
  const reconciled = await getAllReconciledIds()
  if (reconciled.size === 0) return entry

  // Réécriture de l'URL : segments de chemin égaux à un tempId
  let url = entry.url
  for (const [tempId, realId] of reconciled) {
    url = url.replace(new RegExp(`/${tempId}(?=/|$)`), `/${realId}`)
  }

  // Réécriture du corps : valeurs exactement égales à un tempId (récursif)
  const rewriteValue = (value: unknown): unknown => {
    if (typeof value === 'number' && reconciled.has(value)) {
      return reconciled.get(value)
    }
    if (Array.isArray(value)) return value.map(rewriteValue)
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, rewriteValue(v)])
      )
    }
    return value
  }

  return { url, body: entry.body !== undefined ? rewriteValue(entry.body) : entry.body }
}

/**
 * Backoff de la file de synchronisation : 30 s, 1 min, 2 min… plafonné à
 * 15 min, puis plus d'essai automatique (un « Forcer la synchronisation »
 * reste possible à tout moment).
 */
export const MAX_AUTO_SYNC_RETRIES = 8
export const SYNC_BACKOFF_BASE_MS = 30_000
export const SYNC_BACKOFF_MAX_MS = 15 * 60 * 1000

export function syncBackoffMs(retryCount: number): number {
  const exponent = Math.max(retryCount - 1, 0)
  return Math.min(SYNC_BACKOFF_BASE_MS * 2 ** exponent, SYNC_BACKOFF_MAX_MS)
}

/** Une entrée déjà en erreur est-elle réessayable maintenant (sans force) ? */
export function shouldAttemptSyncEntry(
  entry: { syncStatus: string; retryCount: number; createdAt: number; lastAttemptAt?: number },
  force: boolean,
  now: number = Date.now(),
): boolean {
  if (entry.syncStatus === 'synced') return false
  if (force || entry.retryCount === 0) return true
  if (entry.retryCount >= MAX_AUTO_SYNC_RETRIES) return false
  const lastAttempt = entry.lastAttemptAt ?? entry.createdAt
  return now - lastAttempt >= syncBackoffMs(entry.retryCount)
}

/**
 * Process the sync queue when back online.
 * `force` ignore le backoff et la limite d'essais (bouton « Forcer »).
 * Returns results of each synced operation.
 */
export async function processSyncQueue(
  options?: { force?: boolean },
): Promise<Array<{ id: string; status: 'synced' | 'error'; error?: string }>> {
  if (!network.isOnline()) return []
  const force = options?.force ?? false

  const queue = await getSyncQueue()
  const results: Array<{ id: string; status: 'synced' | 'error'; error?: string }> = []

  for (const entry of queue) {
    if (entry.syncStatus === 'synced') {
      await removeSyncEntry(entry.id)
      continue
    }
    if (!shouldAttemptSyncEntry(entry, force)) continue

    try {
      await updateSyncEntry({
        ...entry,
        syncStatus: 'syncing',
        lastAttemptAt: Date.now(),
      })

      // Réécrire les références aux IDs temporaires avant envoi (opérations dépendantes)
      const rewritten = await rewriteDependentEntry(entry)

      const response = await api({
        method: entry.method.toLowerCase(),
        url: rewritten.url,
        data: rewritten.body,
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
        lastAttemptAt: Date.now(),
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

  complete: async (data: { matricule: string; service?: string; new_password: string }): Promise<{ detail: string; user: User }> => {
    const { data: resp } = await api.post('/auth/complete-profile/', data)
    return resp
  },

  getEtablissements: async (): Promise<Array<{ id: number; nom: string }>> => {
    const { data } = await api.get('/auth/etablissements/')
    return data
  },
}

export default api
