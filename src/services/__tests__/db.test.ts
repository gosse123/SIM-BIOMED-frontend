import { describe, it, expect, beforeEach } from 'vitest'
import { put, get, getAll, del, clear, addToSyncQueue, getSyncQueue, purgeAllLocalData, setReconciledId, getAllReconciledIds } from '@/services/db'
import { rewriteDependentEntry } from '@/services/api'

describe('IndexedDB Storage', () => {
  beforeEach(async () => {
    await clear('equipment')
    await clear('sync-queue')
  })

  it('stores and retrieves data with put/get', async () => {
    const testData = { id: 1, nom: 'Test Equipment' }
    await put('equipment', 'eq-1', testData, 60000)

    const result = await get('equipment', 'eq-1')
    expect(result).toEqual(testData)
  })

  it('returns null for expired entries', async () => {
    await put('equipment', 'eq-expired', { id: 2 }, 1) // 1ms TTL

    // Wait for expiry
    await new Promise((r) => setTimeout(r, 10))

    const result = await get('equipment', 'eq-expired')
    expect(result).toBeNull()
  })

  it('returns null for non-existent keys', async () => {
    const result = await get('equipment', 'non-existent')
    expect(result).toBeNull()
  })

  it('getAll returns only non-expired entries', async () => {
    await put('equipment', 'eq-1', { id: 1 }, 60000)
    await put('equipment', 'eq-2', { id: 2 }, 1) // Will expire

    await new Promise((r) => setTimeout(r, 10))

    const results = await getAll('equipment')
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({ id: 1 })
  })

  it('deletes entries', async () => {
    await put('equipment', 'eq-del', { id: 3 }, 60000)
    await del('equipment', 'eq-del')

    const result = await get('equipment', 'eq-del')
    expect(result).toBeNull()
  })

  it('clears entire store', async () => {
    await put('equipment', 'eq-a', { id: 1 }, 60000)
    await put('equipment', 'eq-b', { id: 2 }, 60000)

    await clear('equipment')
    const results = await getAll('equipment')
    expect(results).toHaveLength(0)
  })
})

describe('Purge locale à la déconnexion (§6)', () => {
  it('purgeAllLocalData vide tous les stores, dont la file de sync', async () => {
    await put('equipment', 'eq-1', { id: 1 }, 60000)
    await addToSyncQueue({
      id: 'op-1',
      method: 'POST',
      url: '/api/pannes/',
      body: { description: 'test' },
      createdAt: Date.now(),
    })

    await purgeAllLocalData()

    expect(await getAll('equipment')).toHaveLength(0)
    expect(await getSyncQueue()).toHaveLength(0)
  })
})

describe('Réécriture des opérations dépendantes (§7)', () => {
  it('getAllReconciledIds retourne les mappings tempId → realId', async () => {
    await setReconciledId(-1, 42)
    await setReconciledId(-2, 43)

    const map = await getAllReconciledIds()
    expect(map.get(-1)).toBe(42)
    expect(map.get(-2)).toBe(43)
  })

  it('rewriteDependentEntry réécrit URL et corps', async () => {
    await setReconciledId(-1, 42)

    const rewritten = await rewriteDependentEntry({
      url: '/api/pannes/-1/qualify/',
      body: { panne: -1, commentaire: 'ok' },
    })

    expect(rewritten.url).toBe('/api/pannes/42/qualify/')
    expect((rewritten.body as { panne: number }).panne).toBe(42)
    expect((rewritten.body as { commentaire: string }).commentaire).toBe('ok')
  })

  it('rewriteDependentEntry ne touche pas aux entrées sans mapping', async () => {
    await setReconciledId(-1, 42)

    const rewritten = await rewriteDependentEntry({
      url: '/api/pannes/7/close/',
      body: { panne: 7 },
    })

    expect(rewritten.url).toBe('/api/pannes/7/close/')
    expect((rewritten.body as { panne: number }).panne).toBe(7)
  })
})
