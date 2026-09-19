export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'ADMINISTRATEUR' | 'RESPONSABLE_BIOMEDICAL' | 'TECHNICIEN' | 'PERSONNEL_SOIGNANT' | 'DIRECTION'
  matricule: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}
