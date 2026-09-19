import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { workqueueApi, type WorkQueueStats } from '@/services/workqueue'
import { STATUT_PANNE_LABELS, STATUT_PANNE_COLORS } from '@/types/panne'

const CRITICITE_ICONS: Record<string, string> = {
  CRITIQUE: 'bg-error text-on-error',
  ELEVE: 'bg-amber-500 text-white',
  MOYEN: 'bg-surface-variant text-on-surface',
  FAIBLE: 'bg-surface-container-high text-on-surface-variant',
}

export default function WorkQueuePage() {
  const [stats, setStats] = useState<WorkQueueStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    workqueueApi.get()
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <div className="p-6 text-on-surface-variant">Chargement...</div>
  if (!stats) return <div className="p-6 text-error">Erreur de chargement.</div>

  return (
    <div className="p-6 space-y-6 max-w-[1680px] mx-auto">
      <h1 className="text-xl font-bold text-on-surface">File de travail</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
          <div className="text-3xl font-bold text-on-surface">{stats.total_ouvertes}</div>
          <div className="text-xs text-on-surface-variant mt-1 font-semibold">Pannes ouvertes</div>
        </div>
        {Object.entries(stats.par_criticite).map(([crit, count]) => (
          <div key={crit} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
            <div className="text-3xl font-bold text-on-surface">{count}</div>
            <div className="text-xs text-on-surface-variant mt-1 font-semibold flex items-center justify-center gap-2">
              <span className={`w-3 h-3 rounded-full ${CRITICITE_ICONS[crit]}`} />
              {crit}
            </div>
          </div>
        ))}
      </div>

      {/* Liste priorisée */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-surface-container-low border-b border-surface-container">
          <h2 className="font-semibold text-on-surface text-sm">Pannes ouvertes — triées par criticité</h2>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Priorité</th>
              <th className="py-3 px-4">Équipement</th>
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4">Signalée par</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {stats.pannes.map((panne) => (
              <tr key={panne.id} className="hover:bg-surface-container-low/60 transition-colors">
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${CRITICITE_ICONS[panne.niveau_criticite] || ''}`}>
                    {panne.niveau_criticite}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-on-surface text-sm">{panne.equipement_nom}</div>
                  <div className="text-xs text-on-surface-variant font-mono">{panne.equipement_num}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_PANNE_COLORS[panne.statut as keyof typeof STATUT_PANNE_COLORS] || ''}`}>
                    {STATUT_PANNE_LABELS[panne.statut as keyof typeof STATUT_PANNE_LABELS] || panne.statut}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-on-surface-variant">{panne.signale_par_nom}</td>
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
    </div>
  )
}
