interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  FONCTIONNEL: { label: 'Fonctionnel', className: 'text-emerald-700 font-medium' },
  FONCTIONNEL_SOUS_SURVEILLANCE: { label: 'Sous surveillance', className: 'badge-warning' },
  EN_PANNE: { label: 'En panne', className: 'badge-critical' },
  EN_MAINTENANCE: { label: 'En maintenance', className: 'badge-intervention' },
  EN_ATTENTE_PIECE_OU_PRESTATAIRE: { label: 'En attente', className: 'badge-warning' },
  HORS_SERVICE: { label: 'Hors service', className: 'text-slate-500' },
  REFORME: { label: 'Réformé', className: 'text-slate-500 line-through' },
  SIGNALEE: { label: 'Signalée', className: 'badge-critical' },
  QUALIFIEE: { label: 'Qualifiée', className: 'badge-warning' },
  CRITICITE_EVALUEE: { label: 'Criticité évaluée', className: 'badge-warning' },
  EN_DIAGNOSTIC: { label: 'En diagnostic', className: 'badge-intervention' },
  EN_INTERVENTION: { label: 'En intervention', className: 'badge-intervention' },
  EN_TEST: { label: 'En test', className: 'badge bg-purple-50 text-purple-700 font-semibold' },
  EN_ATTENTE_PIECE: { label: 'En attente pièce', className: 'badge-warning' },
  EN_ATTENTE_PRESTATAIRE: { label: 'En attente prestataire', className: 'badge-warning' },
  CLOSE: { label: 'Clôturée', className: 'text-emerald-700 font-medium' },
  PLANIFIEE: { label: 'Planifiée', className: 'badge-intervention' },
  EN_COURS: { label: 'En cours', className: 'badge-intervention' },
  TERMINEE: { label: 'Terminée', className: 'text-emerald-700 font-medium' },
  ANNULEE: { label: 'Annulée', className: 'text-slate-500 line-through' },
  CONFORME: { label: 'Conforme', className: 'text-emerald-700 font-medium' },
  SOUS_SURVEILLANCE: { label: 'Sous surveillance', className: 'badge-warning' },
  NON_CONFORME: { label: 'Non conforme', className: 'badge-critical' },
  TOUJOURS_EN_PANNE: { label: 'Toujours en panne', className: 'badge-critical' },
}

const CRITICALITY_CONFIG: Record<string, { label: string; className: string }> = {
  CRITIQUE: { label: 'Critique', className: 'badge-critical' },
  ELEVE: { label: 'Élevé', className: 'badge bg-orange-50 text-orange-700 font-semibold' },
  MOYEN: { label: 'Moyen', className: 'badge bg-slate-100 text-slate-700 font-medium' },
  FAIBLE: { label: 'Faible', className: 'text-slate-500 text-xs font-medium' },
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'text-slate-500' }
  const sizeClass = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <span className={`${config.className} ${sizeClass}`} role="status">
      {config.label}
    </span>
  )
}

export function CriticalityBadge({ level }: { level: string }) {
  const config = CRITICALITY_CONFIG[level] || { label: level, className: 'text-slate-500 text-xs font-medium' }
  return (
    <span className={config.className} role="status">
      {config.label}
    </span>
  )
}

export function NotFoundBadge() {
  return <span className="text-slate-500 text-xs">Inconnu</span>
}
