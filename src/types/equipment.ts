export interface Equipment {
  id: number
  num_inventaire: string
  nom: string
  type_equipement: string
  categorie: string
  marque: string
  modele: string
  num_serie?: string
  service: number
  service_nom?: string
  service_detail?: Service
  localisation: number
  localisation_str?: string
  localisation_detail?: Localisation
  date_reception?: string
  date_installation?: string
  date_mise_service?: string
  etat_operationnel: StatutOperationnel
  niveau_criticite: Criticite
  statut_cycle_vie: CycleVie
  created_at: string
  updated_at?: string
}

export interface Service {
  id: number
  nom: string
  description: string
}

export interface Localisation {
  id: number
  batiment: string
  etage: string
  salle: string
}

export type StatutOperationnel =
  | 'FONCTIONNEL'
  | 'FONCTIONNEL_SOUS_SURVEILLANCE'
  | 'EN_PANNE'
  | 'EN_MAINTENANCE'
  | 'EN_ATTENTE_PIECE_OU_PRESTATAIRE'
  | 'HORS_SERVICE'
  | 'REFORME'

export type Criticite = 'CRITIQUE' | 'ELEVE' | 'MOYEN' | 'FAIBLE'

export type CycleVie =
  | 'RECEPTION'
  | 'INSTALLATION'
  | 'MISE_EN_SERVICE'
  | 'EXPLOITATION'
  | 'MAINTENANCE'
  | 'REFORME'
