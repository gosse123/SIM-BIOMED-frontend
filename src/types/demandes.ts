export interface DemandeAcces {
  id: number
  nom_complet: string
  email: string
  role_souhaite: 'TECHNICIEN' | 'PERSONNEL_SOIGNANT' | 'DIRECTION'
  justification: string
  service: string
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REFUSEE'
  traite_par: number | null
  traite_par_username: string | null
  motif_rejet: string
  date_creation: string
  date_traitement: string | null
}

export interface Notification {
  id: number
  titre: string
  message: string
  lu: boolean
  lien: string
  date_creation: string
}
