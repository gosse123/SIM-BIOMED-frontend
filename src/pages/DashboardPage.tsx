import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi, type DashboardData } from '@/services/dashboard'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    dashboardApi.get().then(setData).catch(console.error)
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-[1680px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-on-surface">Tableau de bord</h1>
        <p className="text-sm text-on-surface-variant mt-1">État actuel du parc biomédical</p>
      </div>

      {/* Alertes */}
      {data && (data.maintenances.en_retard > 0 || data.pannes.ouvertes > 0) && (
        <div className="space-y-2">
          {data.maintenances.en_retard > 0 && (
            <div className="bg-error/5 border-l-4 border-error p-4 rounded-r-lg flex items-center gap-3">
              <span className="text-error text-xl">⚠</span>
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  {data.maintenances.en_retard} maintenance(s) préventive(s) en retard
                </p>
                <p className="text-xs text-on-surface-variant">Nécessite une action immédiate</p>
              </div>
              <Link to="/preventive" className="ml-auto text-error text-sm font-semibold hover:underline">
                Voir
              </Link>
            </div>
          )}
          {data.pannes.ouvertes > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center gap-3">
              <span className="text-amber-600 text-xl">🔔</span>
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  {data.pannes.ouvertes} panne(s) ouverte(s) en attente
                </p>
                <p className="text-xs text-on-surface-variant">Consultez la file de travail</p>
              </div>
              <Link to="/workqueue" className="ml-auto text-amber-700 text-sm font-semibold hover:underline">
                Voir
              </Link>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
            <div className="text-3xl font-bold text-on-surface">{data.equipements.total}</div>
            <div className="text-xs text-on-surface-variant mt-1 font-semibold">Équipements</div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
            <div className="text-3xl font-bold text-tertiary">{data.equipements.fonctionnels}</div>
            <div className="text-xs text-on-surface-variant mt-1 font-semibold">Fonctionnels</div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
            <div className="text-3xl font-bold text-error">{data.equipements.en_panne}</div>
            <div className="text-xs text-on-surface-variant mt-1 font-semibold">En panne</div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
            <div className="text-3xl font-bold text-on-surface">{data.pannes.derniers_30_jours}</div>
            <div className="text-xs text-on-surface-variant mt-1 font-semibold">Pannes (30j)</div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/workqueue"
          className="block bg-error/5 rounded-xl p-6 shadow-sm hover:shadow-md transition border border-error/20"
        >
          <div className="text-error font-semibold mb-1">File de travail</div>
          <div className="text-sm text-on-surface-variant">Pannes ouvertes triées par criticité</div>
        </Link>

        <Link
          to="/equipment"
          className="block bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition border border-surface-container"
        >
          <div className="text-primary font-semibold mb-1">Parc équipements</div>
          <div className="text-sm text-on-surface-variant">Gérer l'inventaire du parc</div>
        </Link>

        <Link
          to="/failures"
          className="block bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition border border-surface-container"
        >
          <div className="text-error font-semibold mb-1">Gestion des pannes</div>
          <div className="text-sm text-on-surface-variant">Signaler et suivre les pannes</div>
        </Link>

        <Link
          to="/interventions"
          className="block bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition border border-surface-container"
        >
          <div className="text-tertiary font-semibold mb-1">Interventions</div>
          <div className="text-sm text-on-surface-variant">Suivre les interventions de maintenance</div>
        </Link>

        <Link
          to="/preventive"
          className="block bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition border border-surface-container"
        >
          <div className="text-secondary font-semibold mb-1">Maintenance préventive</div>
          <div className="text-sm text-on-surface-variant">Plans et maintenances préventives</div>
        </Link>

        <Link
          to="/indicators"
          className="block bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition border border-surface-container"
        >
          <div className="text-outline font-semibold mb-1">Indicateurs MTBF/MTTR</div>
          <div className="text-sm text-on-surface-variant">Performance du parc</div>
        </Link>
      </div>
    </div>
  )
}
