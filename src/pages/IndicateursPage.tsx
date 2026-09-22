import { useState, useEffect } from 'react'
import { indicateursApi, type Indicateur } from '@/services/indicateurs'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/FeedbackStates'
import PageHeader from '@/components/ui/PageHeader'
import KpiCard from '@/components/ui/KpiCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Clock, AlertTriangle } from 'lucide-react'

export default function IndicateursPage() {
  const [indicateurs, setIndicateurs] = useState<Indicateur[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await indicateursApi.get()
      setIndicateurs(data)
      setError('')
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  const withMtbf = indicateurs.filter(i => i.mtbf_jours !== null)
  const withMttr = indicateurs.filter(i => i.mttr_heures !== null)
  const avgMtbf = withMtbf.length > 0 ? withMtbf.reduce((a, i) => a + (i.mtbf_jours || 0), 0) / withMtbf.length : 0
  const avgMttr = withMttr.length > 0 ? withMttr.reduce((a, i) => a + (i.mttr_heures || 0), 0) / withMttr.length : 0
  const totalPannes = indicateurs.reduce((a, i) => a + i.nb_pannes, 0)

  const chartData = indicateurs.slice(0, 10).map(i => ({
    name: i.nom?.substring(0, 15) || `#${i.equipement_id}`,
    pannes: i.nb_pannes,
    mttr: i.mttr_heures || 0,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Indicateurs de performance" description="Analyse de la fiabilité du parc biomédical" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="MTBF moyen" value={`${Math.round(avgMtbf * 10) / 10} j`} status="normal" icon={<TrendingUp className="w-4 h-4" />} />
        <KpiCard label="MTTR moyen" value={`${Math.round(avgMttr * 10) / 10} h`} status="normal" icon={<Clock className="w-4 h-4" />} />
        <KpiCard label="Pannes clôturées" value={totalPannes} status="normal" icon={<AlertTriangle className="w-4 h-4" />} />
      </div>

      {indicateurs.length === 0 ? (
        <EmptyState title="Aucun indicateur disponible" />
      ) : (
        <div className="card p-6">
          <h2 className="mb-4">Nombre de pannes par équipement</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="pannes" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {indicateurs.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Équipement</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">Pannes</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">MTBF (jours)</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide" scope="col">MTTR (heures)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {indicateurs.map((ind) => (
                <tr key={ind.equipement_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{ind.nom}</p>
                    <p className="mono mt-0.5">{ind.num_inventaire}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{ind.nb_pannes}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{ind.mtbf_jours !== null ? `${ind.mtbf_jours} j` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{ind.mttr_heures !== null ? `${ind.mttr_heures} h` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
