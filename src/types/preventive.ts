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
  PLANIFIEE: 'bg-primary-fixed text-on-primary-fixed-variant border border-primary/20',
  EN_COURS: 'bg-teal-50 text-teal-800 border border-teal-200',
  TERMINEE: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  ANNULEE: 'bg-surface-container-high text-outline border border-outline-variant',
  EN_RETARD: 'bg-error-container text-on-error-container border border-error/20',
}
