import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/Modal'

interface DiagnosticModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { description_diagnostic: string; cause_identifiee: string }) => void
  loading?: boolean
}

export default function DiagnosticModal({ isOpen, onClose, onConfirm }: DiagnosticModalProps) {
  const [desc, setDesc] = useState('')
  const [cause, setCause] = useState('')

  const handleSubmit = () => {
    if (!desc.trim() || !cause.trim()) return
    onConfirm({ description_diagnostic: desc, cause_identifiee: cause })
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Diagnostiquer la panne"
      confirmLabel="Diagnostiquer"
      variant="primary"
      onConfirm={handleSubmit}
    >
      <div className="space-y-3">
        <div>
          <label className="input-label">Description du diagnostic *</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="input"
            placeholder="Décrivez les résultats de l'investigation..."
            required
          />
        </div>
        <div>
          <label className="input-label">Cause identifiée *</label>
          <textarea
            value={cause}
            onChange={(e) => setCause(e.target.value)}
            rows={2}
            className="input"
            placeholder="Composant défectueux, erreur logicielle..."
            required
          />
        </div>
      </div>
    </ConfirmDialog>
  )
}
