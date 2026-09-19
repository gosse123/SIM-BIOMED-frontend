import { useState, useEffect } from 'react'
import { indicateursApi, type Indicateur } from '@/services/indicateurs'

export default function IndicateursPage() {
  const [indicateurs, setIndicateurs] = useState<Indicateur[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    indicateursApi.get()
      .then(setIndicateurs)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const avgMtbf = indicateurs.filter(i => i.mtbf_jours !== null).reduce((acc, i) => acc + (i.mtbf_jours || 0), 0) / (indicateurs.filter(i => i.mtbf_jours !== null).length || 1)
  const avgMttr = indicateurs.filter(i => i.mttr_heures !== null).reduce((acc, i) => acc + (i.mttr_heures || 0), 0) / (indicateurs.filter(i => i.mttr_heures !== null).length || 1)
  const totalPannes = indicateurs.reduce((acc, i) => acc + i.nb_pannes, 0)

  return (
    <div className="p-6 space-y-6 max-w-[1680px] mx-auto">
      <h1 className="text-xl font-bold text-on-surface">Indicateurs de performance</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
          <div className="text-3xl font-bold text-on-surface">{Math.round(avgMtbf * 10) / 10}</div>
          <div className="text-xs text-on-surface-variant mt-1 font-semibold">MTBF moyen (jours)</div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
          <div className="text-3xl font-bold text-on-surface">{Math.round(avgMttr * 10) / 10}</div>
          <div className="text-xs text-on-surface-variant mt-1 font-semibold">MTTR moyen (heures)</div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
          <div className="text-3xl font-bold text-on-surface">{totalPannes}</div>
          <div className="text-xs text-on-surface-variant mt-1 font-semibold">Total pannes clôturées</div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-on-surface-variant">Chargement...</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Équipement</th>
                <th className="py-3 px-4">Pannes</th>
                <th className="py-3 px-4">MTBF (jours)</th>
                <th className="py-3 px-4">MTTR (heures)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {indicateurs.map((ind) => (
                <tr key={ind.equipement_id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-on-surface text-sm">{ind.nom}</div>
                    <div className="text-xs text-on-surface-variant font-mono">{ind.num_inventaire}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface font-semibold">{ind.nb_pannes}</td>
                  <td className="py-3 px-4 text-sm text-on-surface">
                    {ind.mtbf_jours !== null ? `${ind.mtbf_jours} j` : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface">
                    {ind.mttr_heures !== null ? `${ind.mttr_heures} h` : '—'}
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
