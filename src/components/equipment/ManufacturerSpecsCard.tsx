import { Cpu } from 'lucide-react'

interface ManufacturerSpecsCardProps {
  marque: string
  modele: string
  num_serie?: string
  categorie: string
  type_equipement: string
}

export default function ManufacturerSpecsCard({ marque, modele, num_serie, categorie, type_equipement }: ManufacturerSpecsCardProps) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-slate-600" />
        </div>
        <h2>Spécifications constructeur</h2>
      </div>

      <div className="aspect-video bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
        <div className="text-center text-slate-400">
          <Cpu className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Photo de l'équipement</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Marque</span>
          <span className="font-medium text-slate-900">{marque}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Modèle</span>
          <span className="font-medium text-slate-900">{modele}</span>
        </div>
        {num_serie && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">N° Série</span>
            <span className="mono">{num_serie}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Type</span>
          <span className="font-medium text-slate-900">{type_equipement}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Catégorie</span>
          <span className="font-medium text-slate-900">{categorie}</span>
        </div>
      </div>
    </div>
  )
}
