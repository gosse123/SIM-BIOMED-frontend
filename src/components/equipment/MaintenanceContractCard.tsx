import { Shield } from 'lucide-react'

export default function MaintenanceContractCard() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Shield className="w-4 h-4 text-indigo-600" />
        </div>
        <h2>Contrat de maintenance</h2>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Prestataire</span>
          <span className="font-medium text-slate-900">—</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Type contrat</span>
          <span className="text-slate-400 italic">Non défini</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Échéance</span>
          <span className="text-slate-400 italic">—</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Dernière intervention</span>
          <span className="text-slate-400 italic">—</span>
        </div>
      </div>
    </div>
  )
}
