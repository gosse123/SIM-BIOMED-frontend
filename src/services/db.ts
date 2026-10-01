/**
 * IndexedDB abstraction for offline storage.
 * Provides CRUD operations with TTL support.
 */

const DB_NAME = 'simbiomed'
const DB_VERSION = 1

export type StoreName =
  | 'equipment'
  | 'services'
  | 'locations'
  | 'pannes'
  | 'interventions'
  | 'maintenance-preventive'
  | 'maintenance-plans'
  | 'workqueue'
  | 'dashboard'
  | 'indicateurs'
  | 'sync-queue'
  | 'pending-entities'

const STORES: StoreName[] = [
  'equipment',
  'services',
  'locations',
  'pannes',
  'interventions',
  'maintenance-preventive',
  'maintenance-plans',
  'workqueue',
  'dashboard',
  'indicateurs',
  'sync-queue',
  'pending-entities',
]

interface CacheEntry<T = unknown> {
  key: string
  data: T
  cachedAt: number
  ttl: number
}

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'key' })
        }
      }
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onerror = () => reject(request.error)
  })
}

/**
 * Store data with TTL
 */
export async function put<T>(
  storeName: StoreName,
  key: string,
  data: T,
  ttlMs: number = 15 * 60 * 1000 // default 15 min
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const entry: CacheEntry<T> = {
      key,
      data,
      cachedAt: Date.now(),
      ttl: ttlMs,
    }
    const request = store.put(entry)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get data if not expired
 */
export async function get<T>(storeName: StoreName, key: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(key) as IDBRequest<CacheEntry<T> | undefined>
    request.onsuccess = () => {
      const entry = request.result
      if (!entry) return resolve(null)
      if (Date.now() - entry.cachedAt > entry.ttl) {
        // Expired, delete it
        const delTx = db.transaction(storeName, 'readwrite')
        delTx.objectStore(storeName).delete(key)
        return resolve(null)
      }
      resolve(entry.data)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all entries from a store (not expired)
 */
export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll() as IDBRequest<CacheEntry<T>[]>
    request.onsuccess = () => {
      const now = Date.now()
      const valid = request.result
        .filter((e) => now - e.cachedAt <= e.ttl)
        .map((e) => e.data)
      resolve(valid)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Delete an entry
 */
export async function del(storeName: StoreName, key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all entries from a store
 */
export async function clear(storeName: StoreName): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Add to sync queue (for offline mutations)
 */
export interface SyncQueueEntry {
  id: string // UUID
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  url: string
  body?: unknown
  headers?: Record<string, string>
  createdAt: number
  syncedAt?: number
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error'
  retryCount: number
  /** Horodatage de la dernière tentative (backoff entre les retries). */
  lastAttemptAt?: number
  error?: string
}

export async function addToSyncQueue(entry: Omit<SyncQueueEntry, 'syncStatus' | 'retryCount'>): Promise<void> {
  const fullEntry: SyncQueueEntry = {
    ...entry,
    syncStatus: 'pending',
    retryCount: 0,
  }
  await put('sync-queue', fullEntry.id, fullEntry, Infinity)
}

export async function getSyncQueue(): Promise<SyncQueueEntry[]> {
  return getAll<SyncQueueEntry>('sync-queue')
}

export async function updateSyncEntry(entry: SyncQueueEntry): Promise<void> {
  await put('sync-queue', entry.id, entry, Infinity)
}

export async function removeSyncEntry(id: string): Promise<void> {
  await del('sync-queue', id)
}

/**
 * Pending entity: a temporary offline entity that needs server reconciliation.
 */
export interface PendingEntity {
  tempId: number       // Negative temp ID returned to the UI
  offlineId: string    // Sync queue entry ID
  store: StoreName     // Which cache store it belongs to
  cacheKey: string     // Cache key for the temp entity
  entity: unknown      // The full entity data
  createdAt: number
}

export async function addPendingEntity(entity: PendingEntity): Promise<void> {
  await put('pending-entities', String(entity.tempId), entity, Infinity)
}

export async function getPendingEntity(tempId: number): Promise<PendingEntity | null> {
  return get<PendingEntity>('pending-entities', String(tempId))
}

export async function getAllPendingEntities(): Promise<PendingEntity[]> {
  return getAll<PendingEntity>('pending-entities')
}

export async function getPendingEntityByOfflineId(offlineId: string): Promise<PendingEntity | null> {
  const all = await getAll<PendingEntity>('pending-entities')
  return all.find((e) => e.offlineId === offlineId) ?? null
}

export async function removePendingEntity(tempId: number): Promise<void> {
  await del('pending-entities', String(tempId))
}

/**
 * Get the real server ID for a previously-reconciled temporary ID.
 * Returns null if not yet reconciled.
 */
export async function getReconciledId(tempId: number): Promise<number | null> {
  const entity = await get<{ realId: number }>('pending-entities', `reconciled-${tempId}`)
  return entity?.realId ?? null
}

export async function setReconciledId(tempId: number, realId: number): Promise<void> {
  await put('pending-entities', `reconciled-${tempId}`, { realId }, Infinity)
}

/**
 * Retourne tous les mappings tempId → realId réconciliés,
 * pour réécrire les opérations dépendantes encore en file.
 */
export async function getAllReconciledIds(): Promise<Map<number, number>> {
  const db = await openDB()
  const entries = await new Promise<Array<{ key: string; data: { realId: number } }>>((resolve, reject) => {
    const tx = db.transaction('pending-entities', 'readonly')
    const store = tx.objectStore('pending-entities')
    const request = store.getAll() as IDBRequest<Array<{ key: string; data: { realId: number } }>>
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  const map = new Map<number, number>()
  for (const e of entries) {
    if (e.key.startsWith('reconciled-')) {
      map.set(Number(e.key.replace('reconciled-', '')), e.data.realId)
    }
  }
  return map
}

/**
 * Purge complète du stockage local (à la déconnexion) :
 * vide tous les stores, y compris la file de synchronisation,
 * pour éviter toute fuite de données entre utilisateurs (§6).
 */
export async function purgeAllLocalData(): Promise<void> {
  const db = await openDB()
  for (const store of STORES) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite')
      const request = tx.objectStore(store).clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}
