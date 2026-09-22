import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/Modal'

interface TestResultModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { resultat_test: string }) => void
  loading?: boolean
}

const RESULTATS = [
  { value: 'CONFORME', label: 'Conforme', color: 'text-emerald-600' },
  { value: 'SOUS_SURVEILLANCE', label: 'Sous surveillance', color: 'text-amber-600' },
  { value: 'NON_CONFORME', label: 'Non conforme', color: 'text-red-600' },
  { value: 'TOUJOURS_EN_PANNE', label: 'Toujours en panne', color: 'text-red-700' },
]

export default function TestResultModal({ isOpen, onClose, onConfirm }: TestResultModalProps) {
  const [resultat, setResultat] = useState('CONFORME')

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Résultat du test"
      confirmLabel="Enregistrer"
      variant="primary"
      onConfirm={() => onConfirm({ resultat_test: resultat })}
    >
      <div className="space-y-3">
        <label className="input-label">Résultat du test post-réparation</label>
        <div className="space-y-2">
          {RESULTATS.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                resultat === r.value
                  ? 'border-sky-400 bg-sky-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="resultat_test"
                value={r.value}
                checked={resultat === r.value}
                onChange={(e) => setResultat(e.target.value)}
                className="accent-sky-600"
              />
              <span className={`text-sm font-medium ${r.color}`}>{r.label}</span>
            </label>
          ))}
        </div>
        {resultat === 'NON_CONFORME' && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
            La clôture ne sera pas possible avec ce résultat. Une nouvelle intervention sera nécessaire.
          </p>
        )}
      </div>
    </ConfirmDialog>
  )
}
