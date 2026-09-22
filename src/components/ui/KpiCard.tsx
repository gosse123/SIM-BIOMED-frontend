import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string | number
  delta?: string
  deltaDirection?: 'up' | 'down' | 'neutral'
  target?: string
  status?: 'normal' | 'warning' | 'danger' | 'success'
  icon?: ReactNode
  subValue?: string
}

const statusBorders = {
  normal: 'border-slate-200',
  warning: 'border-l-4 border-l-amber-500 border-t-amber-200 border-r-amber-200 border-b-amber-200',
  danger: 'border-l-4 border-l-red-500 border-t-red-200 border-r-red-200 border-b-red-200',
  success: 'border-l-4 border-l-emerald-500 border-t-emerald-200 border-r-emerald-200 border-b-emerald-200',
}

const DeltaIcon = ({ direction }: { direction: string }) => {
  if (direction === 'up') return <TrendingUp className="w-3 h-3 text-emerald-500" />
  if (direction === 'down') return <TrendingDown className="w-3 h-3 text-red-500" />
  return <Minus className="w-3 h-3 text-slate-400" />
}

export default function KpiCard({ label, value, delta, deltaDirection = 'neutral', target, status = 'normal', icon, subValue }: KpiCardProps) {
  return (
    <div className={`card p-4 ${statusBorders[status]} animate-count-up`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {delta && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${deltaDirection === 'up' ? 'text-emerald-600' : deltaDirection === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
            <DeltaIcon direction={deltaDirection} />
            {delta}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 mt-2">
        {target && <span className="text-[10px] text-slate-400">Objectif: {target}</span>}
        {subValue && <span className="text-[10px] text-slate-500">{subValue}</span>}
      </div>
    </div>
  )
}
