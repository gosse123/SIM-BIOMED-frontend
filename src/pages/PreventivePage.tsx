import { useState, useEffect } from 'react'
import { preventiveApi } from '@/services/preventive'
import type { MaintenancePreventive } from '@/types/preventive'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/FeedbackStates'
import PageHeader from '@/components/ui/PageHeader'
import { toast } from '@/components/ui/toast'
import { getApiErrorMessage } from '@/utils/errors'
import { Play, CheckCircle2 } from 'lucide-react'

export default function PreventivePage() {
  const [maintenances, setMaintenances] = useState<MaintenancePreventive[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await preventiveApi.listPreventive()
      setMaintenances(data)
      setError('')
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleStart = async (id: number) => {
    try {
      await preventiveApi.start(id)
      toast('success', 'Maintenance démarrée')
      fetchData()
    } catch (err) {
      toast('error', getApiErrorMessage(err, 'Erreur lors du démarrage.'))
    }
  }

  const handleFinish = async (id: number) => {
    try {
      await preventiveApi.finish(id, { commentaire: '' })
      toast('success', 'Maintenance terminée')
      fetchData()
    } catch (err) {
      toast('error', getApiErrorMessage(err, 'Erreur lors de la finalisation.'))
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance préventive" description={`${maintenances.length} maintenance${maintenances.length > 1 ? 's' : ''}`} />

      {maintenances.length === 0 ? (
        <EmptyState title="Aucune maintenance préventive" description="Aucune maintenance préventive n'est planifiée." />
      ) : (
        <>
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Équipement</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Plan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Statut</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Date planifiée</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenances.map((mp) => (
                  <tr key={mp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{mp.equipement_nom || `Équipement #${mp.equipement}`}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{mp.plan_nom}</td>
                    <td className="px-4 py-3"><StatusBadge status={mp.statut} /></td>
                    <td className="px-4 py-3 text-sm text-slate-500">{new Date(mp.date_planifiee).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 flex gap-2">
                      {mp.statut === 'PLANIFIEE' && (
                        <button onClick={() => handleStart(mp.id)} className="btn-primary text-xs"><Play className="w-3 h-3" /> Démarrer</button>
                      )}
                      {mp.statut === 'EN_COURS' && (
                        <button onClick={() => handleFinish(mp.id)} className="btn-primary text-xs"><CheckCircle2 className="w-3 h-3" /> Terminer</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {maintenances.map((mp) => (
              <div key={mp.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{mp.equipement_nom || `Équipement #${mp.equipement}`}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{mp.plan_nom} • {new Date(mp.date_planifiee).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <StatusBadge status={mp.statut} />
                </div>
                <div className="mt-3 flex gap-2">
                  {mp.statut === 'PLANIFIEE' && <button onClick={() => handleStart(mp.id)} className="btn-primary text-xs"><Play className="w-3 h-3" /> Démarrer</button>}
                  {mp.statut === 'EN_COURS' && <button onClick={() => handleFinish(mp.id)} className="btn-primary text-xs"><CheckCircle2 className="w-3 h-3" /> Terminer</button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
