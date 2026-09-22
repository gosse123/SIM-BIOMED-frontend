/**
 * Network status manager.
 * Detects online/offline and notifies subscribers.
 */

type StatusCallback = (isOnline: boolean) => void

class NetworkManager {
  private _isOnline: boolean = navigator.onLine
  private _listeners: Set<StatusCallback> = new Set()

  constructor() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  private handleOnline = () => {
    this._isOnline = true
    this.notify()
  }

  private handleOffline = () => {
    this._isOnline = false
    this.notify()
  }

  private notify() {
    for (const cb of this._listeners) {
      try {
        cb(this._isOnline)
      } catch {
        // silent
      }
    }
  }

  isOnline(): boolean {
    return this._isOnline
  }

  onChange(callback: StatusCallback): () => void {
    this._listeners.add(callback)
    return () => this._listeners.delete(callback)
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    this._listeners.clear()
  }
}

export const network = new NetworkManager()
