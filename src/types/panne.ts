import type { Equipment } from './equipment'
import type { User } from './auth'

export interface Panne {
  id: number
  equipement: number
  equipement_detail?: Equipment
  equipement_nom?: string
  equipement_num?: string
  date_signalement: string
  signale_par: number
  signale_par_nom?: string
  signale_par_detail?: User
  description_signalement: string
  date_qualification?: string
  qualifiee_par?: number
  qualifiee_par_detail?: User
  observation_qualification?: string
  critere_urgence?: string
  statut: StatutPanne
  critere_impact?: string
  critere_criticite?: string
  niveau_criticite?: CriticitePanne
  date_diagnostic?: string
  diagnostique_par?: number
  diagnostique_par_detail?: User
  description_diagnostic?: string
  cause_identifiee?: string
  resultat_test: ResultatTest
  date_cloture?: string
  cloturee_par?: number
  cloturee_par_detail?: User
  commentaire_cloture?: string
  created_at: string
  updated_at?: string
  transitions_valides?: string[]
}

export type StatutPanne =
  | 'SIGNALEE'
  | 'QUALIFIEE'
  | 'CRITICITE_EVALUEE'
  | 'EN_DIAGNOSTIC'
  | 'EN_INTERVENTION'
  | 'EN_TEST'
  | 'EN_ATTENTE_PIECE'
  | 'EN_ATTENTE_PRESTATAIRE'
  | 'CLOSE'

export type CriticitePanne = 'CRITIQUE' | 'ELEVE' | 'MOYEN' | 'FAIBLE'

export type ResultatTest =
  | 'CONFORME'
  | 'SOUS_SURVEILLANCE'
  | 'NON_CONFORME'
  | 'TOUJOURS_EN_PANNE'

export const STATUT_PANNE_LABELS: Record<StatutPanne, string> = {
  SIGNALEE: 'Signalée',
  QUALIFIEE: 'Qualifiée',
  CRITICITE_EVALUEE: 'Criticité évaluée',
  EN_DIAGNOSTIC: 'En diagnostic',
  EN_INTERVENTION: 'En intervention',
  EN_TEST: 'En test',
  EN_ATTENTE_PIECE: 'En attente de pièce',
  EN_ATTENTE_PRESTATAIRE: 'En attente de prestataire',
  CLOSE: 'Clôturée',
}

export const STATUT_PANNE_COLORS: Record<StatutPanne, string> = {
  SIGNALEE: 'bg-error/10 text-error border border-error/20',
  QUALIFIEE: 'bg-amber-50 text-amber-800 border border-amber-200',
  CRITICITE_EVALUEE: 'bg-orange-50 text-orange-800 border border-orange-200',
  EN_DIAGNOSTIC: 'bg-primary-fixed text-on-primary-fixed-variant border border-primary/20',
  EN_INTERVENTION: 'bg-surface-variant text-on-surface border border-outline-variant',
  EN_TEST: 'bg-teal-50 text-teal-800 border border-teal-200',
  EN_ATTENTE_PIECE: 'bg-surface-container-high text-outline border border-outline-variant',
  EN_ATTENTE_PRESTATAIRE: 'bg-surface-container-high text-outline border border-outline-variant',
  CLOSE: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
}
