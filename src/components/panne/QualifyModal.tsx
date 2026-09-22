import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/Modal'

interface QualifyModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { observation_qualification: string; critere_urgence: string }) => void
}

export default function QualifyModal({ isOpen, onClose, onConfirm }: QualifyModalProps) {
  const [obs, setObs] = useState('')
  const [urgence, setUrgence] = useState('')

  const handleSubmit = () => {
    if (!obs.trim()) return
    onConfirm({ observation_qualification: obs, critere_urgence: urgence })
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Qualifier la panne"
      confirmLabel="Qualifier"
      variant="primary"
      onConfirm={handleSubmit}
    >
      <div className="space-y-3">
        <div>
          <label className="input-label">Observation de qualification *</label>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            rows={3}
            className="input"
            placeholder="Décrivez l'analyse du problème signalé..."
            required
          />
        </div>
        <div>
          <label className="input-label">Critère d'urgence</label>
          <input
            value={urgence}
            onChange={(e) => setUrgence(e.target.value)}
            className="input"
            placeholder="Ex: Impact sur les soins, disponibilité alternative..."
          />
        </div>
      </div>
    </ConfirmDialog>
  )
}
