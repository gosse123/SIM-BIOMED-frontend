import { Loader2, AlertTriangle, Inbox } from 'lucide-react'

export function LoadingState({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500" role="status" aria-label={message}>
      <Loader2 className="w-8 h-8 animate-spin text-medical-primary mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-sm font-medium text-slate-900 mb-1">Erreur de chargement</p>
      <p className="text-xs text-slate-500 mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary text-xs">
          Réessayer
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-6 h-6 text-slate-400" />}
      </div>
      <p className="text-sm font-medium text-slate-900 mb-1">{title}</p>
      {description && <p className="text-xs text-slate-500 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}
