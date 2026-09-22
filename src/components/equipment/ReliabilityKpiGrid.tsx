import { TrendingUp, Clock, CheckCircle2 } from 'lucide-react'

interface ReliabilityKpiGridProps {
  availability?: string
  mtbf?: string
  mttr?: string
}

export default function ReliabilityKpiGrid({
  availability = '98.4%',
  mtbf = '2 450 h',
  mttr = '1.8 h',
}: ReliabilityKpiGridProps) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <h2>Indicateurs de fiabilité</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{availability}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Disponibilité</p>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <TrendingUp className="w-5 h-5 text-sky-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{mtbf}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">MTBF</p>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{mttr}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">MTTR</p>
        </div>
      </div>
    </div>
  )
}
