import type { Equipment } from './equipment'

export interface Intervention {
  id: number
  panne_id?: number
  equipement: number
  equipement_nom?: string
  equipement_detail?: Equipment
  type_intervention: TypeIntervention
  statut: StatutIntervention
  description: string
  pieces_utilisees?: string
  temps_passe_minutes: number
  date_debut?: string
  date_fin?: string
  realisee_par?: number
  realisee_par_nom?: string
  created_at: string
  updated_at?: string
}

export type TypeIntervention = 'CORRECTIVE' | 'PREVENTIVE' | 'PREDICTIVE' | 'AMELIORATIVE'

export type StatutIntervention = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE'

export const TYPE_INTERVENTION_LABELS: Record<TypeIntervention, string> = {
  CORRECTIVE: 'Corrective',
  PREVENTIVE: 'Préventive',
  PREDICTIVE: 'Prédictive',
  AMELIORATIVE: 'Améliorative',
}

export const STATUT_INTERVENTION_LABELS: Record<StatutIntervention, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
}

export const STATUT_INTERVENTION_COLORS: Record<StatutIntervention, string> = {
  PLANIFIEE: 'bg-slate-100 text-slate-700 border border-slate-200',
  EN_COURS: 'bg-sky-50 text-sky-700 border border-sky-200',
  TERMINEE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ANNULEE: 'bg-slate-100 text-slate-500 border border-slate-200',
}
