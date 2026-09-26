export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'ADMINISTRATEUR' | 'RESPONSABLE_BIOMEDICAL' | 'TECHNICIEN' | 'PERSONNEL_SOIGNANT' | 'DIRECTION'
  matricule: string
  is_active: boolean
  profil_complete: boolean
  etablissement?: number | null
  etablissement_nom?: string | null
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}
