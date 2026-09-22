import { Link } from 'react-router-dom'
import { StatusBadge, CriticalityBadge } from '@/components/ui/StatusBadge'
import type { Equipment } from '@/types/equipment'
import { AlertTriangle, Wrench, Printer, Edit } from 'lucide-react'

interface DeviceDetailHeaderProps {
  device: Equipment
  onReportFault: () => void
}

export default function DeviceDetailHeader({ device, onReportFault }: DeviceDetailHeaderProps) {
  return (
    <div className="card p-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={device.etat_operationnel} size="md" />
            <CriticalityBadge level={device.niveau_criticite} />
            <span className="badge bg-sky-50 text-sky-700 border border-sky-200">CE</span>
            <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">ANSM</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{device.nom}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="mono">{device.num_inventaire}</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500">UMDNS: —</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{device.marque} {device.modele}</span>
            {device.num_serie && (
              <>
                <span className="text-slate-300">•</span>
                <span className="mono">S/N: {device.num_serie}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button onClick={onReportFault} className="btn-danger text-xs">
            <AlertTriangle className="w-4 h-4" /> Signaler une panne
          </button>
          <Link to={`/interventions/new?equipment=${device.id}`} className="btn-primary text-xs">
            <Wrench className="w-4 h-4" /> Planifier maint.
          </Link>
          <button className="btn-secondary text-xs">
            <Printer className="w-4 h-4" /> Imprimer QR
          </button>
          <Link to={`/equipment/${device.id}/edit`} className="btn-ghost text-xs">
            <Edit className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
