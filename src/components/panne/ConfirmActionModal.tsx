import { ConfirmDialog } from '@/components/ui/Modal'

interface ConfirmActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
}

export default function ConfirmActionModal({
  isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirmer', variant = 'primary',
}: ConfirmActionModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      variant={variant}
      onConfirm={onConfirm}
    />
  )
}
