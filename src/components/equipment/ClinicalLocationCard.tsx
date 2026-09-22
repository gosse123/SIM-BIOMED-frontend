import { MapPin } from 'lucide-react'
import type { Equipment } from '@/types/equipment'

interface ClinicalLocationCardProps {
  equipment: Equipment
}

export default function ClinicalLocationCard({ equipment }: ClinicalLocationCardProps) {
  const loc = equipment.localisation_detail
  const svc = equipment.service_detail

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-sky-600" />
        </div>
        <h2>Affectation clinique</h2>
      </div>

      <div className="space-y-3">
        {loc ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Bâtiment</span>
              <span className="font-medium text-slate-900">{loc.batiment}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Étage</span>
              <span className="font-medium text-slate-900">{loc.etage}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Salle</span>
              <span className="font-medium text-slate-900">{loc.salle}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Emplacement</span>
            <span className="font-medium text-slate-900">{equipment.localisation_str || '—'}</span>
          </div>
        )}
        {svc && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Service</span>
            <span className="font-medium text-slate-900">{svc.nom}</span>
          </div>
        )}
        {!svc && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Service</span>
            <span className="font-medium text-slate-900">{equipment.service_nom || '—'}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Chef de service</span>
          <span className="text-slate-400 italic">—</span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100">
        <div className="h-24 bg-gradient-to-br from-sky-50 to-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
          <span className="text-xs text-slate-400">Carte du site</span>
        </div>
      </div>
    </div>
  )
}
