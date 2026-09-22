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
  SIGNALEE: 'bg-red-50 text-red-700 border border-red-200',
  QUALIFIEE: 'bg-amber-50 text-amber-700 border border-amber-200',
  CRITICITE_EVALUEE: 'bg-orange-50 text-orange-700 border border-orange-200',
  EN_DIAGNOSTIC: 'bg-sky-50 text-sky-700 border border-sky-200',
  EN_INTERVENTION: 'bg-blue-50 text-blue-700 border border-blue-200',
  EN_TEST: 'bg-purple-50 text-purple-700 border border-purple-200',
  EN_ATTENTE_PIECE: 'bg-slate-100 text-slate-700 border border-slate-200',
  EN_ATTENTE_PRESTATAIRE: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  CLOSE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}
