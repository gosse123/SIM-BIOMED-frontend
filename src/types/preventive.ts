import type { Equipment } from './equipment'

export interface MaintenancePlan {
  id: number
  nom: string
  description: string
  type_equipement: string
  frequence: Frequence
  delai_jours: number
  created_at: string
}

export type Frequence =
  | 'HEBDOMADAIRE'
  | 'BIMENSUELLE'
  | 'MENSUELLE'
  | 'TRIMESTRIELLE'
  | 'SEMESTRIELLE'
  | 'ANNUELLE'

export interface MaintenancePreventive {
  id: number
  plan: number
  plan_nom?: string
  plan_detail?: MaintenancePlan
  equipement: number
  equipement_nom?: string
  equipement_detail?: Equipment
  statut: StatutMaintenance
  date_planifiee: string
  date_effective?: string
  realisee_par?: number
  commentaire?: string
  created_at: string
  updated_at?: string
}

export type StatutMaintenance = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'EN_RETARD'

export const FREQUENCE_LABELS: Record<Frequence, string> = {
  HEBDOMADAIRE: 'Hebdomadaire',
  BIMENSUELLE: 'Bimensuelle',
  MENSUELLE: 'Mensuelle',
  TRIMESTRIELLE: 'Trimestrielle',
  SEMESTRIELLE: 'Semestrielle',
  ANNUELLE: 'Annuelle',
}

export const STATUT_MAINTENANCE_LABELS: Record<StatutMaintenance, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
  EN_RETARD: 'En retard',
}

export const STATUT_MAINTENANCE_COLORS: Record<StatutMaintenance, string> = {
  PLANIFIEE: 'bg-sky-50 text-sky-700 border border-sky-200',
  EN_COURS: 'bg-teal-50 text-teal-700 border border-teal-200',
  TERMINEE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ANNULEE: 'bg-slate-100 text-slate-500 border border-slate-200',
  EN_RETARD: 'bg-red-50 text-red-700 border border-red-200',
}
