import { useState, useEffect } from 'react'
import { useAuth } from '@/app/AuthContext'
import { network } from '@/services/network'
import { syncEngine, type SyncStatus as SyncStatusType } from '@/services/sync'
import { RefreshCw, Check, X, WifiOff, ChevronDown } from 'lucide-react'

const STATUS_CONFIG: Record<SyncStatusType, { label: string; color: string; bg: string; icon: typeof RefreshCw }> = {
  idle: { label: '', color: '', bg: '', icon: RefreshCw },
  syncing: { label: 'Synchronisation...', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: RefreshCw },
  synced: { label: 'Synchronisé', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: Check },
  error: { label: 'Erreur de sync', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: X },
  offline: { label: 'Hors ligne', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: WifiOff },
}

export default function SyncStatus() {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(network.isOnline())
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>('idle')
  const [pendingCount, setPendingCount] = useState(0)
  const [showDetail, setShowDetail] = useState(false)

  const isAdmin = user?.role === 'ADMINISTRATEUR'

  useEffect(() => {
    const unsubNet = network.onChange(setIsOnline)
    const unsubSync = syncEngine.onStatusChange((status, pending) => {
      setSyncStatus(status)
      setPendingCount(pending)
    })
    return () => { unsubNet(); unsubSync() }
  }, [])

  const handleForceSync = async () => {
    setShowDetail(false)
    const result = await syncEngine.sync()
    if (result.errors > 0) {
      alert(`Sync terminée : ${result.synced} ok, ${result.errors} erreurs`)
    }
  }

  const effectiveStatus = !isOnline ? 'offline' : syncStatus
  const effectiveConfig = STATUS_CONFIG[effectiveStatus]

  if (effectiveStatus === 'idle' && pendingCount === 0) return null

  const Icon = effectiveConfig.icon

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetail(!showDetail)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${effectiveConfig.bg} ${effectiveConfig.color}`}
      >
        <Icon className={`w-3.5 h-3.5 ${effectiveStatus === 'syncing' ? 'animate-spin' : ''}`} />
        {effectiveConfig.label}
        {pendingCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/5 text-[10px]">
            {pendingCount}
          </span>
        )}
        <ChevronDown className="w-3 h-3" />
      </button>

      {showDetail && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-modal border border-slate-200 z-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900">État de synchronisation</h3>
            <button onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Réseau</span>
              <span className={`font-semibold ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Statut sync</span>
              <span className={`font-semibold ${effectiveConfig.color}`}>{effectiveConfig.label}</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">En attente</span>
                <span className="font-semibold text-slate-900">{pendingCount} opération(s)</span>
              </div>
            )}
          </div>

          {!isOnline && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
              Les modifications seront synchronisées automatiquement quand la connexion sera restaurée.
            </div>
          )}

          {isOnline && isAdmin && pendingCount > 0 && (
            <button
              onClick={handleForceSync}
              className="w-full py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors"
            >
              Forcer la synchronisation
            </button>
          )}
        </div>
      )}
    </div>
  )
}
