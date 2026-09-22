import { FileText, User, Wrench, CheckCircle2, Clock } from 'lucide-react'

interface AuditEvent {
  id: number
  date: string
  type: 'PANNE' | 'INTERVENTION' | 'METROLOGIE' | 'INSTALLATION' | 'MAINTENANCE'
  description: string
  intervenant: string
  pieces?: string
  pv_ref?: string
}

const EVENT_ICONS: Record<string, typeof FileText> = {
  PANNE: FileText,
  INTERVENTION: Wrench,
  METROLOGIE: CheckCircle2,
  INSTALLATION: Clock,
  MAINTENANCE: Wrench,
}

const EVENT_COLORS: Record<string, string> = {
  PANNE: 'bg-red-100 text-red-600',
  INTERVENTION: 'bg-sky-100 text-sky-600',
  METROLOGIE: 'bg-emerald-100 text-emerald-600',
  INSTALLATION: 'bg-purple-100 text-purple-600',
  MAINTENANCE: 'bg-amber-100 text-amber-600',
}

const MOCK_EVENTS: AuditEvent[] = [
  { id: 1, date: '2026-09-15T14:30:00', type: 'INTERVENTION', description: 'Remplacement filtre HEPA', intervenant: 'Ing. Lea Dubois', pieces: 'Filtre HEPA x2' },
  { id: 2, date: '2026-09-01T09:00:00', type: 'METROLOGIE', description: 'Étalonnage capteur O₂', intervenant: 'Tech. Marc Vella', pv_ref: 'PV-2026-0452' },
  { id: 3, date: '2026-08-20T11:15:00', type: 'PANNE', description: 'Alarme seuil haute pression', intervenant: 'Signalement Dr. Martin' },
  { id: 4, date: '2026-07-10T08:00:00', type: 'MAINTENANCE', description: 'Maintenance préventive trimestrielle', intervenant: 'Ing. Lea Dubois', pieces: 'Kit VP x1, Joint x4' },
  { id: 5, date: '2026-03-15T10:00:00', type: 'INSTALLATION', description: 'Mise en service initiale', intervenant: 'Ing. Lea Dubois + Tech. Marc Vella' },
]

export default function AuditTimeline() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
          <Clock className="w-4 h-4 text-purple-600" />
        </div>
        <h2>Journal d'audit & Traçabilité</h2>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />

        <div className="space-y-4">
          {MOCK_EVENTS.map((event) => {
            const Icon = EVENT_ICONS[event.type] || FileText
            return (
              <div key={event.id} className="relative flex gap-4">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${EVENT_COLORS[event.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{event.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{event.intervenant}</span>
                      </div>
                    </div>
                    <time className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(event.date).toLocaleDateString('fr-FR')}
                    </time>
                  </div>
                  {(event.pieces || event.pv_ref) && (
                    <div className="flex items-center gap-3 mt-2">
                      {event.pieces && (
                        <span className="badge bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                          <Wrench className="w-3 h-3 inline mr-1" />{event.pieces}
                        </span>
                      )}
                      {event.pv_ref && (
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                          <FileText className="w-3 h-3 inline mr-1" />{event.pv_ref}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
