import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Download } from 'lucide-react'
import { equipmentApi } from '@/services/equipment'
import type { Equipment, Service } from '@/types/equipment'
import { StatusBadge, CriticalityBadge } from '@/components/ui/StatusBadge'
import SearchInput from '@/components/ui/SearchInput'
import PageHeader from '@/components/ui/PageHeader'
import { ErrorState, EmptyState } from '@/components/ui/FeedbackStates'

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-32 animate-pulse" /><div className="h-3 bg-slate-50 rounded w-24 mt-1 animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-20 animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded-full w-20 animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded-full w-16 animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-12 animate-pulse" /></td>
    </tr>
  )
}

function exportCSV(items: Equipment[]) {
  const headers = ['N° Inventaire', 'Nom', 'Type', 'Marque', 'Modèle', 'Service', 'Statut', 'Criticité']
  const rows = items.map(e => [
    e.num_inventaire, e.nom, e.type_equipement, e.marque, e.modele,
    e.service_nom || '', e.etat_operationnel, e.niveau_criticite
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `parc-equipements-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function EquipmentListPage() {
  const [items, setItems] = useState<Equipment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCriticality, setFilterCriticality] = useState('')
  const [filterService, setFilterService] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [eqData, svcData] = await Promise.all([equipmentApi.list(), equipmentApi.listServices()])
      setItems(eqData)
      setServices(svcData)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = items.filter((item) => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      item.nom?.toLowerCase().includes(q) ||
      item.num_inventaire?.toLowerCase().includes(q) ||
      item.marque?.toLowerCase().includes(q) ||
      item.num_serie?.toLowerCase().includes(q)
    const matchStatus = !filterStatus || item.etat_operationnel === filterStatus
    const matchCriticality = !filterCriticality || item.niveau_criticite === filterCriticality
    const matchService = !filterService || String(item.service) === filterService
    return matchSearch && matchStatus && matchCriticality && matchService
  })

  const handleExport = useCallback(() => exportCSV(filtered), [filtered])

  if (loading) return (
    <div className="space-y-6">
      <PageHeader title="Parc biomédical" description="Chargement..." />
      <div className="card p-4"><div className="h-10 bg-slate-100 rounded animate-pulse" /></div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3"><div className="h-3 bg-slate-200 rounded w-16 animate-pulse" /></th>
            <th className="px-4 py-3"><div className="h-3 bg-slate-200 rounded w-16 animate-pulse" /></th>
            <th className="px-4 py-3"><div className="h-3 bg-slate-200 rounded w-16 animate-pulse" /></th>
            <th className="px-4 py-3"><div className="h-3 bg-slate-200 rounded w-16 animate-pulse" /></th>
            <th className="px-4 py-3"><div className="h-3 bg-slate-200 rounded w-16 animate-pulse" /></th>
          </tr></thead>
          <tbody>{[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}</tbody>
        </table>
      </div>
    </div>
  )
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parc biomédical"
        description={`${items.length} équipement${items.length > 1 ? 's' : ''} enregistré${items.length > 1 ? 's' : ''}`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn-secondary text-xs" aria-label="Exporter en CSV">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <Link to="/equipment/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Ajouter
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher (nom, N°inv, marque, N° série)..." className="flex-1" />
          <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="input w-full sm:w-48" aria-label="Filtrer par service">
            <option value="">Tous les services</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-full sm:w-48" aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            <option value="FONCTIONNEL">Fonctionnel</option>
            <option value="EN_PANNE">En panne</option>
            <option value="EN_MAINTENANCE">En maintenance</option>
            <option value="FONCTIONNEL_SOUS_SURVEILLANCE">Sous surveillance</option>
            <option value="HORS_SERVICE">Hors service</option>
            <option value="REFORME">Réformé</option>
          </select>
          <select value={filterCriticality} onChange={(e) => setFilterCriticality(e.target.value)} className="input w-full sm:w-48" aria-label="Filtrer par criticité">
            <option value="">Toutes les criticités</option>
            <option value="CRITIQUE">Critique</option>
            <option value="ELEVE">Élevé</option>
            <option value="MOYEN">Moyen</option>
            <option value="FAIBLE">Faible</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun équipement trouvé"
          description={search || filterStatus || filterCriticality || filterService ? "Aucun équipement ne correspond aux filtres." : "Aucun équipement enregistré."}
          action={(search || filterStatus || filterCriticality || filterService) ? (
            <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterCriticality(''); setFilterService('') }} className="btn-secondary text-xs">
              Réinitialiser les filtres
            </button>
          ) : undefined}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-left" aria-label="Liste des équipements">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Équipement</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Service</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Statut</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Criticité</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors min-h-[56px]">
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.nom}</p>
                        <p className="mono mt-0.5">{item.num_inventaire}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{item.service_nom || '—'}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={item.etat_operationnel} /></td>
                    <td className="px-4 py-3.5"><CriticalityBadge level={item.niveau_criticite} /></td>
                    <td className="px-4 py-3.5">
                      <Link to={`/equipment/${item.id}`} className="btn-ghost text-xs" aria-label={`Voir ${item.nom}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((item) => (
              <Link key={item.id} to={`/equipment/${item.id}`} className="card-hover block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.nom}</p>
                    <p className="mono mt-0.5">{item.num_inventaire}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.service_nom || '—'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={item.etat_operationnel} />
                    <CriticalityBadge level={item.niveau_criticite} />
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
