import { describe, it, expect, beforeEach } from 'vitest'
import { put, get, getAll, del, clear } from '@/services/db'

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
