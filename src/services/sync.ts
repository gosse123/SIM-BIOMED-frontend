/**
 * Moteur de synchronisation : traite la file hors ligne,
 * synchronisation automatique au retour réseau et sync forcée manuelle.
 */
import { network } from './network'
import { processSyncQueue } from './api'
import { getSyncQueue } from './db'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

type StatusCallback = (status: SyncStatus, pendingCount: number) => void

class SyncEngine {
  private _status: SyncStatus = 'idle'
  private _pendingCount: number = 0
  private _listeners: Set<StatusCallback> = new Set()
  private _isProcessing: boolean = false
  private _syncInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // Synchronisation automatique au retour réseau : nouvelle tentative
    // immédiate (force), sans attendre le backoff.
    network.onChange((isOnline) => {
      if (isOnline) {
        void this.sync({ force: true })
      } else {
        this.setStatus('offline')
      }
    })

    // Vérification initiale
    if (!network.isOnline()) {
      this._status = 'offline'
    }

    // Tentative périodique de synchronisation (toutes les 30 s en ligne)
    this._syncInterval = setInterval(() => {
      if (network.isOnline() && this._pendingCount > 0 && !this._isProcessing) {
        this.sync()
      }
      this.updatePendingCount()
    }, 30000)
  }

  private setStatus(status: SyncStatus) {
    this._status = status
    this.notify()
  }

  private async updatePendingCount() {
    try {
      const queue = await getSyncQueue()
      const pending = queue.filter((e) => e.syncStatus !== 'synced').length
      if (pending !== this._pendingCount) {
        this._pendingCount = pending
        this.notify()
      }
    } catch {
      // silencieux
    }
  }

  private notify() {
    for (const cb of this._listeners) {
      try {
        cb(this._status, this._pendingCount)
      } catch {
        // silencieux
      }
    }
  }

  get status() {
    return this._status
  }

  get pendingCount() {
    return this._pendingCount
  }

  /**
   * Synchronisation : traite la file hors ligne.
   * `force` ignore le backoff et la limite d'essais automatiques
   * (bouton « Forcer la synchronisation », retour en ligne).
   * Appelée aussi automatiquement toutes les 30 s (sans force).
   */
  async sync(options?: { force?: boolean }): Promise<{ synced: number; errors: number }> {
    if (this._isProcessing) return { synced: 0, errors: 0 }
    if (!network.isOnline()) {
      this.setStatus('offline')
      return { synced: 0, errors: 0 }
    }

    this._isProcessing = true
    this.setStatus('syncing')

    try {
      const results = await processSyncQueue({ force: options?.force })
      const synced = results.filter((r: { status: string }) => r.status === 'synced').length
      const errors = results.filter((r: { status: string }) => r.status === 'error').length

      await this.updatePendingCount()

      if (errors > 0 || this._pendingCount > 0) {
        // reste des opérations non synchronisées (erreur ou en backoff)
        this.setStatus('error')
      } else {
        this.setStatus('synced')
        // Retour au repos après 3 secondes
        setTimeout(() => {
          if (this._status === 'synced') {
            this.setStatus('idle')
          }
        }, 3000)
      }

      return { synced, errors }
    } catch {
      this.setStatus('error')
      return { synced: 0, errors: 1 }
    } finally {
      this._isProcessing = false
    }
  }

  /**
   * Abonnement aux changements de statut.
   * Retourne la fonction de désabonnement.
   */
  onStatusChange(callback: StatusCallback): () => void {
    this._listeners.add(callback)
    // Émission immédiate avec l'état courant
    callback(this._status, this._pendingCount)
    return () => this._listeners.delete(callback)
  }

  destroy() {
    if (this._syncInterval) {
      clearInterval(this._syncInterval)
    }
    this._listeners.clear()
  }
}

export const syncEngine = new SyncEngine()
