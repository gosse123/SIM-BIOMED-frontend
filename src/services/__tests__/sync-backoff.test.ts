import { describe, it, expect } from 'vitest'
import {
  shouldAttemptSyncEntry,
  syncBackoffMs,
  MAX_AUTO_SYNC_RETRIES,
} from '@/services/api'

const T = 1_000_000

describe('backoff de la file de synchronisation', () => {
  it('double le délai à chaque échec, plafonné à 15 minutes', () => {
    expect(syncBackoffMs(1)).toBe(30_000)
    expect(syncBackoffMs(2)).toBe(60_000)
    expect(syncBackoffMs(3)).toBe(120_000)
    expect(syncBackoffMs(4)).toBe(240_000)
    expect(syncBackoffMs(0)).toBe(30_000)
    expect(syncBackoffMs(50)).toBe(15 * 60 * 1000)
  })

  it('ignore une entrée en erreur pendant son backoff', () => {
    const entry = { syncStatus: 'error', retryCount: 1, createdAt: T, lastAttemptAt: T }
    expect(shouldAttemptSyncEntry(entry, false, T + 29_000)).toBe(false)
    expect(shouldAttemptSyncEntry(entry, false, T + 30_000)).toBe(true)
  })

  it('borne le nombre d essais automatiques', () => {
    const entry = {
      syncStatus: 'error',
      retryCount: MAX_AUTO_SYNC_RETRIES,
      createdAt: T,
      lastAttemptAt: T,
    }
    expect(shouldAttemptSyncEntry(entry, false, T + 60 * 60 * 1000)).toBe(false)
    expect(shouldAttemptSyncEntry(entry, true, T)).toBe(true)
  })

  it('force ignore le backoff même juste après un échec', () => {
    const entry = { syncStatus: 'error', retryCount: 2, createdAt: T, lastAttemptAt: T }
    expect(shouldAttemptSyncEntry(entry, true, T + 1)).toBe(true)
  })

  it('une entrée jamais tentée part immédiatement', () => {
    const entry = { syncStatus: 'pending', retryCount: 0, createdAt: T }
    expect(shouldAttemptSyncEntry(entry, false, T)).toBe(true)
  })

  it('sans lastAttemptAt, la date de création fait foi', () => {
    const entry = { syncStatus: 'error', retryCount: 1, createdAt: T }
    expect(shouldAttemptSyncEntry(entry, false, T + 10_000)).toBe(false)
    expect(shouldAttemptSyncEntry(entry, false, T + 30_000)).toBe(true)
  })

  it('ne retente jamais une entrée synchronisée', () => {
    const entry = { syncStatus: 'synced', retryCount: 0, createdAt: 0 }
    expect(shouldAttemptSyncEntry(entry, true, T)).toBe(false)
  })
})
