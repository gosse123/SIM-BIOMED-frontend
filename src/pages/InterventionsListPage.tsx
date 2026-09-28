import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { interventionApi } from '@/services/intervention'
import type { Intervention } from '@/types/intervention'
import { TYPE_INTERVENTION_LABELS, STATUT_INTERVENTION_LABELS } from '@/types/intervention'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/FeedbackStates'
import PageHeader from '@/components/ui/PageHeader'
import SearchInput from '@/components/ui/SearchInput'
import { Plus } from 'lucide-react'

export default function InterventionsListPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await interventionApi.list()
      setInterventions(data)
      setError('')
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = interventions.filter((i) => {
    const matchSearch = !search || i.equipement_nom?.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || i.type_intervention === filterType
    const matchStatut = !filterStatut || i.statut === filterStatut
    return matchSearch && matchType && matchStatut
  })

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interventions"
        description={`${interventions.length} intervention${interventions.length > 1 ? 's' : ''}`}
        action={
          <Link to="/interventions/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Nouvelle
          </Link>
        }
      />

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." className="flex-1" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input w-full sm:w-44" aria-label="Filtrer par type">
            <option value="">Tous les types</option>
            {(Object.entries(TYPE_INTERVENTION_LABELS) as [string, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="input w-full sm:w-44" aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            {(Object.entries(STATUT_INTERVENTION_LABELS) as [string, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune intervention trouvée" />
      ) : (
        <div className="hidden md:block card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Équipement</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Statut</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Temps</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{i.equipement_nom || `Équipement #${i.equipement}`}</p>
                    {i.panne_id && <p className="text-xs text-slate-500 mt-0.5">Panne #{i.panne_id}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{TYPE_INTERVENTION_LABELS[i.type_intervention]}</td>
                  <td className="px-4 py-3"><StatusBadge status={i.statut} /></td>
                  <td className="px-4 py-3 text-sm text-slate-500">{i.temps_passe_minutes ? `${i.temps_passe_minutes} min` : '—'}</td>
                  <td className="px-4 py-3">
                    <Link to={`/interventions/${i.id}`} className="btn-ghost text-xs">Voir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((i) => (
          <Link key={i.id} to={`/interventions/${i.id}`} className="card-hover block p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{i.equipement_nom || `Équipement #${i.equipement}`}</p>
                <p className="text-xs text-slate-500 mt-0.5">{TYPE_INTERVENTION_LABELS[i.type_intervention]}</p>
              </div>
              <StatusBadge status={i.statut} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
