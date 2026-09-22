import { describe, it, expect, vi, beforeEach } from 'vitest'
import { network } from '@/services/network'

describe('NetworkManager', () => {
  beforeEach(() => {
    // Reset to online
    Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
  })

  it('initializes with navigator.onLine', () => {
    expect(network.isOnline()).toBe(true)
  })

  it('notifies subscribers on status change', () => {
    const callback = vi.fn()
    const unsub = network.onChange(callback)

    // Simulate offline
    window.dispatchEvent(new Event('offline'))
    expect(callback).toHaveBeenCalledWith(false)

    // Simulate online
    window.dispatchEvent(new Event('online'))
    expect(callback).toHaveBeenCalledWith(true)

    unsub()
  })

  it('unsubscribes correctly', () => {
    const callback = vi.fn()
    const unsub = network.onChange(callback)

    unsub()
    window.dispatchEvent(new Event('offline'))
    expect(callback).not.toHaveBeenCalled()
  })
})
