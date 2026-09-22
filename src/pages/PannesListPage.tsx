import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { panneApi } from '@/services/panne'
import type { Panne } from '@/types/panne'
import { STATUT_PANNE_LABELS } from '@/types/panne'
import { StatusBadge, CriticalityBadge } from '@/components/ui/StatusBadge'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/FeedbackStates'
import PageHeader from '@/components/ui/PageHeader'
import { Plus } from 'lucide-react'

export default function PannesListPage() {
  const [pannes, setPannes] = useState<Panne[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await panneApi.list()
      setPannes(data)
      setError('')
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = filterStatut ? pannes.filter(p => p.statut === filterStatut) : pannes

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des pannes"
        description={`${pannes.length} panne${pannes.length > 1 ? 's' : ''}`}
        action={
          <Link to="/failures/new" className="btn-danger">
            <Plus className="w-4 h-4" /> Signaler
          </Link>
        }
      />

      <div className="card p-4">
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="input w-full sm:w-64"
          aria-label="Filtrer par statut"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_PANNE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune panne trouvée" />
      ) : (
        <>
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Équipement</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Statut</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Criticité</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((panne) => (
                  <tr key={panne.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{panne.equipement_nom || `Équipement #${panne.equipement}`}</p>
                      <p className="mono mt-0.5">Panne #{panne.id}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={panne.statut} /></td>
                    <td className="px-4 py-3"><CriticalityBadge level={panne.niveau_criticite || ''} /></td>
                    <td className="px-4 py-3 text-sm text-slate-500">{new Date(panne.date_signalement).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <Link to={`/failures/${panne.id}`} className="btn-ghost text-xs">Gérer</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((panne) => (
              <Link key={panne.id} to={`/failures/${panne.id}`} className="card-hover block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{panne.equipement_nom || `Équipement #${panne.equipement}`}</p>
                    <p className="mono mt-0.5">Panne #{panne.id}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(panne.date_signalement).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={panne.statut} />
                    <CriticalityBadge level={panne.niveau_criticite || ''} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
