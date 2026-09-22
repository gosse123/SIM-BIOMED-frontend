import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all dependencies before importing
vi.mock('@/services/network', () => ({
  network: {
    isOnline: () => true,
    onChange: (cb: (online: boolean) => void) => {
      cb(true)
      return () => {}
    },
  },
}))

vi.mock('@/services/api', () => ({
  processSyncQueue: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/db', () => ({
  getSyncQueue: vi.fn().mockResolvedValue([]),
}))

// Import after mocks
import { syncEngine } from '@/services/sync'

describe('SyncEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('has a valid initial status', () => {
    expect(['idle', 'synced', 'offline']).toContain(syncEngine.status)
  })

  it('pendingCount starts at 0', () => {
    expect(syncEngine.pendingCount).toBe(0)
  })

  it('sync returns empty when online with no queue', async () => {
    const result = await syncEngine.sync()
    expect(result).toEqual({ synced: 0, errors: 0 })
  })

  it('notifies subscribers', () => {
    const callback = vi.fn()
    const unsub = syncEngine.onStatusChange(callback)
    expect(callback).toHaveBeenCalled()
    unsub()
  })
})
