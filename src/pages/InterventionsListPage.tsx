import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { interventionApi } from '@/services/intervention'
import type { Intervention } from '@/types/intervention'
import { TYPE_INTERVENTION_LABELS, STATUT_INTERVENTION_LABELS, STATUT_INTERVENTION_COLORS } from '@/types/intervention'

export default function InterventionsListPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadInterventions()
  }, [])

  const loadInterventions = async () => {
    setIsLoading(true)
    try {
      const data = await interventionApi.list()
      setInterventions(data.results || data)
    } catch (error) {
      console.error('Erreur chargement interventions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1680px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Interventions</h1>
          <p className="text-sm text-on-surface-variant mt-1">{interventions.length} interventions enregistrées</p>
        </div>
        <Link
          to="/interventions/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container transition shadow-sm"
        >
          Nouvelle intervention
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-on-surface-variant">Chargement...</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Équipement</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Temps</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {interventions.map((interv) => (
                <tr key={interv.id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-on-surface text-sm">{interv.equipement_nom || `Équipement #${interv.equipement}`}</div>
                    {interv.panne_id && (
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        Liée à la panne #{interv.panne_id}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface">
                    {TYPE_INTERVENTION_LABELS[interv.type_intervention]}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_INTERVENTION_COLORS[interv.statut]}`}>
                      {STATUT_INTERVENTION_LABELS[interv.statut]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface-variant">
                    {interv.temps_passe_minutes ? `${interv.temps_passe_minutes} min` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to={`/interventions/${interv.id}`} className="text-primary hover:text-primary-container text-sm font-semibold">
                      Voir
                    </Link>
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
