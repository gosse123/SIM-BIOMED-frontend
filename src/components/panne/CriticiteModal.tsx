import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/Modal'

interface CriticiteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { critere_impact: string; niveau_criticite: string }) => void
  loading?: boolean
}

export default function CriticiteModal({ isOpen, onClose, onConfirm }: CriticiteModalProps) {
  const [impact, setImpact] = useState('')
  const [criticite, setCriticite] = useState('MOYEN')

  const handleSubmit = () => {
    if (!impact.trim()) return
    onConfirm({ critere_impact: impact, niveau_criticite: criticite })
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Évaluer la criticité"
      confirmLabel="Évaluer"
      variant="primary"
      onConfirm={handleSubmit}
    >
      <div className="space-y-3">
        <div>
          <label className="input-label">Critère d'impact *</label>
          <input
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            className="input"
            placeholder="Ex: Risque patient, impact sur activité..."
            required
          />
        </div>
        <div>
          <label className="input-label">Niveau de criticité</label>
          <select value={criticite} onChange={(e) => setCriticite(e.target.value)} className="input">
            <option value="FAIBLE">Faible</option>
            <option value="MOYEN">Moyen</option>
            <option value="ELEVE">Élevé</option>
            <option value="CRITIQUE">Critique</option>
          </select>
        </div>
      </div>
    </ConfirmDialog>
  )
}
