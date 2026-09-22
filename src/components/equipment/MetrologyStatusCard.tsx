import { Ruler, CalendarClock } from 'lucide-react'

export default function MetrologyStatusCard() {
  const today = new Date()
  const nextTest = new Date(today)
  nextTest.setMonth(nextTest.getMonth() + 3)
  const daysUntil = Math.ceil((nextTest.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <Ruler className="w-4 h-4 text-amber-600" />
        </div>
        <h2>Registre métrologique</h2>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Dernier étalonnage O₂</span>
          <span className="font-medium text-slate-900">15/06/2026</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Prochain test sécurité élec.</span>
          <span className="font-medium text-slate-900">{nextTest.toLocaleDateString('fr-FR')}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">
            <strong className="text-sky-600">{daysUntil} jours</strong> restants
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Conformité</span>
          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Conforme</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Dernier PV</span>
          <span className="text-slate-600 font-medium">PV-2026-0452</span>
        </div>
      </div>
    </div>
  )
}
