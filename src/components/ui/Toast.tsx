import { useState, useEffect, useRef } from 'react'
import { CheckCircle, AlertCircle, X, type LucideIcon } from 'lucide-react'
import { registerToastListener, type Toast } from './toast'

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons: Record<string, LucideIcon> = {
    success: CheckCircle,
    error: AlertCircle,
    info: AlertCircle,
  }
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }
  const progressColors = {
    success: 'bg-emerald-400',
    error: 'bg-red-400',
    info: 'bg-blue-400',
  }
  const Icon = icons[toast.type]
  const duration = toast.duration || 3500

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, onRemove])

  return (
    <div
      className={`flex flex-col rounded-lg border shadow-card animate-slide-in overflow-hidden ${colors[toast.type]}`}
      role="alert"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon className="w-4 h-4 shrink-0" />
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button
          onClick={() => onRemove(toast.id)}
          className="p-0.5 rounded hover:bg-black/5 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="h-0.5 bg-black/5">
        <div
          className={`h-full ${progressColors[toast.type]} animate-toast-progress`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef(0)

  useEffect(() => {
    return registerToastListener((t) => {
      const id = String(++counterRef.current)
      setToasts((prev) => [...prev, { ...t, id }])
    })
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  )
}
