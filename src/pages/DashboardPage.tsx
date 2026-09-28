import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, Wrench, Clock, ChevronRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts'
import KpiCard from '@/components/ui/KpiCard'
import { StatusBadge, CriticalityBadge } from '@/components/ui/StatusBadge'
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates'
import { dashboardApi, type DashboardData } from '@/services/dashboard'
import { workqueueApi, type WorkQueueItem } from '@/services/workqueue'
import { getApiErrorMessage } from '@/utils/errors'

const STATUS_COLORS: Record<string, string> = {
  FONCTIONNEL: '#16a34a',
  EN_PANNE: '#dc2626',
  EN_MAINTENANCE: '#2563eb',
  FONCTIONNEL_SOUS_SURVEILLANCE: '#ea580c',
  HORS_SERVICE: '#64748b',
  REFORME: '#94a3b8',
}

const STATUS_LABELS: Record<string, string> = {
  FONCTIONNEL: 'Fonctionnel',
  EN_PANNE: 'En panne',
  EN_MAINTENANCE: 'En maintenance',
  FONCTIONNEL_SOUS_SURVEILLANCE: 'Sous surveillance',
  HORS_SERVICE: 'Hors service',
  REFORME: 'Réformé',
}

const CRITICITE_ROW_COLORS: Record<string, string> = {
  CRITIQUE: 'bg-red-50',
  ELEVE: 'bg-blue-50',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [urgentPannes, setUrgentPannes] = useState<WorkQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [dashData, wqData] = await Promise.all([dashboardApi.get(), workqueueApi.get()])
      setData(dashData)
      const sorted = [...(wqData.pannes || [])].sort((a, b) => {
        const order: Record<string, number> = { CRITIQUE: 0, ELEVE: 1, MOYEN: 2, FAIBLE: 3 }
        return (order[a.niveau_criticite] ?? 4) - (order[b.niveau_criticite] ?? 4)
      })
      setUrgentPannes(sorted)
      setError('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur de chargement'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={fetchData} />
  if (!data) return null

  const equipements: Partial<DashboardData['equipements']> = data.equipements || {}
  const pannes: Partial<DashboardData['pannes']> = data.pannes || {}
  const maintenances: Partial<DashboardData['maintenances']> = data.maintenances || {}

  const total = equipements.total || 0
  const fonctionnels = equipements.fonctionnels || 0
  const enPanne = equipements.en_panne || 0
  const disponibilite = total > 0 ? ((fonctionnels / total) * 100).toFixed(1) : '0'
  const enRetard = maintenances.en_retard || 0

  const donutData = Object.entries(pannes.par_statut || {}).map(([key, val]) => ({
    name: STATUS_LABELS[key] || key,
    value: val as number,
    color: STATUS_COLORS[key] || '#64748b',
  }))

  const trendData = [
    { mois: 'Avr', disponibilite: 90.5 },
    { mois: 'Mai', disponibilite: 91.0 },
    { mois: 'Juin', disponibilite: 91.2 },
    { mois: 'Juil', disponibilite: 91.8 },
    { mois: 'Août', disponibilite: 92.0 },
    { mois: 'Sept', disponibilite: parseFloat(disponibilite) || 92.3 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Tableau de bord</h1>
          <p className="text-sm text-slate-500 mt-1">Supervision du parc biomédical — Site Central</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Disponibilité globale"
          value={`${disponibilite}%`}
          target="95%"
          delta="+1.2%"
          deltaDirection="up"
          status={parseFloat(disponibilite) >= 95 ? 'success' : parseFloat(disponibilite) >= 90 ? 'warning' : 'danger'}
          icon={<Activity className="w-4 h-4" />}
        />
        <KpiCard
          label="En panne"
          value={enPanne}
          subValue={enPanne > 0 ? `${enPanne} critique${enPanne > 1 ? 's' : ''}` : undefined}
          status={enPanne > 0 ? 'danger' : 'success'}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <KpiCard
          label="En maintenance"
          value={pannes.par_statut?.EN_INTERVENTION || 0}
          status="normal"
          icon={<Wrench className="w-4 h-4" />}
        />
        <KpiCard
          label="Total équipements"
          value={total}
          icon={<Activity className="w-4 h-4" />}
        />
        <KpiCard
          label="Préventives en retard"
          value={enRetard}
          status={enRetard > 0 ? 'danger' : 'success'}
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h2 className="mb-4">Évolution de la disponibilité</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorDisp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [`${value}%`, 'Disponibilité']}
                />
                <ReferenceLine
                  y={95}
                  stroke="#dc2626"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{ value: 'Objectif 95%', position: 'right', fill: '#dc2626', fontSize: 11 }}
                />
                <Area type="monotone" dataKey="disponibilite" stroke="#0284c7" strokeWidth={2} fill="url(#colorDisp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4">Répartition des statuts</h2>
          {donutData.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {donutData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">Aucune donnée de panne</p>
          )}
        </div>
      </div>

      {/* Urgent Incidents Table */}
      {urgentPannes.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h2>Incidents urgents</h2>
              <span className="badge bg-red-50 text-red-700 border border-red-200 text-[10px]">
                {urgentPannes.length}
              </span>
            </div>
            <Link to="/workqueue" className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
              Voir la file <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <table className="w-full text-left" aria-label="Incidents urgents">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Priorité</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Équipement</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Statut</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Signalé par</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {urgentPannes.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${CRITICITE_ROW_COLORS[p.niveau_criticite] || ''}`}>
                  <td className="px-4 py-3"><CriticalityBadge level={p.niveau_criticite} /></td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{p.equipement_nom}</p>
                    <p className="mono mt-0.5">{p.equipement_num}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.statut} /></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.signale_par_nom}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{new Date(p.date_signalement).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <Link to={`/failures/${p.id}`} className="btn-ghost text-xs">Gérer</Link>
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
