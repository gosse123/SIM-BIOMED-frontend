import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { panneApi } from '@/services/panne'
import type { Panne } from '@/types/panne'
import { STATUT_PANNE_LABELS, STATUT_PANNE_COLORS } from '@/types/panne'

export default function PannesListPage() {
  const [pannes, setPannes] = useState<Panne[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState('')

  useEffect(() => {
    loadPannes()
  }, [])

  const loadPannes = async () => {
    setIsLoading(true)
    try {
      const data = await panneApi.list()
      setPannes(data.results || data)
    } catch (error) {
      console.error('Erreur chargement pannes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = filterStatut
    ? pannes.filter((p) => p.statut === filterStatut)
    : pannes

  return (
    <div className="p-6 space-y-6 max-w-[1680px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Gestion des pannes</h1>
          <p className="text-sm text-on-surface-variant mt-1">{pannes.length} pannes enregistrées</p>
        </div>
        <Link
          to="/failures/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-error text-on-error font-semibold text-sm hover:bg-error/90 transition shadow-sm"
        >
          Signaler une panne
        </Link>
      </div>

      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm">
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_PANNE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-on-surface-variant">Chargement...</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Équipement</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Criticité</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filtered.map((panne) => (
                <tr key={panne.id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-on-surface text-sm">{panne.equipement_nom || `Équipement #${panne.equipement}`}</div>
                    <div className="text-xs text-on-surface-variant font-mono mt-0.5">
                      Panne #{panne.id} — {panne.equipement_num}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_PANNE_COLORS[panne.statut]}`}>
                      {STATUT_PANNE_LABELS[panne.statut]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface">
                    {panne.niveau_criticite || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface-variant">
                    {new Date(panne.date_signalement).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to={`/failures/${panne.id}`} className="text-primary hover:text-primary-container text-sm font-semibold">
                      Gérer
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
