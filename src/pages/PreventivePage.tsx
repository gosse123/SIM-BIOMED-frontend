import { useState, useEffect } from 'react'
import { preventiveApi } from '@/services/preventive'
import type { MaintenancePreventive } from '@/types/preventive'
import { STATUT_MAINTENANCE_LABELS, STATUT_MAINTENANCE_COLORS } from '@/types/preventive'

export default function PreventivePage() {
  const [maintenances, setMaintenances] = useState<MaintenancePreventive[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMaintenances()
  }, [])

  const loadMaintenances = async () => {
    setIsLoading(true)
    try {
      const data = await preventiveApi.listPreventive()
      setMaintenances(data.results || data)
    } catch (error) {
      console.error('Erreur chargement maintenances:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStart = async (id: number) => {
    try {
      await preventiveApi.start(id)
      loadMaintenances()
    } catch (error: any) {
      alert(error?.response?.data?.detail || 'Erreur lors du démarrage.')
    }
  }

  const handleFinish = async (id: number) => {
    try {
      await preventiveApi.finish(id, { commentaire: '' })
      loadMaintenances()
    } catch (error: any) {
      alert(error?.response?.data?.detail || 'Erreur lors de la finalisation.')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1680px] mx-auto">
      <h1 className="text-xl font-bold text-on-surface">Maintenance préventive</h1>

      {isLoading ? (
        <div className="text-center py-12 text-on-surface-variant">Chargement...</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Équipement</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Date planifiée</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {maintenances.map((mp) => (
                <tr key={mp.id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-on-surface text-sm">{mp.equipement_nom || `Équipement #${mp.equipement}`}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface">{mp.plan_nom}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_MAINTENANCE_COLORS[mp.statut]}`}>
                      {STATUT_MAINTENANCE_LABELS[mp.statut]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface-variant">
                    {new Date(mp.date_planifiee).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {mp.statut === 'PLANIFIEE' && (
                      <button onClick={() => handleStart(mp.id)} className="text-primary hover:text-primary-container text-sm font-semibold">
                        Démarrer
                      </button>
                    )}
                    {mp.statut === 'EN_COURS' && (
                      <button onClick={() => handleFinish(mp.id)} className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold">
                        Terminer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
