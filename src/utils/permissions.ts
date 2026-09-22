import type { User } from '@/types/auth'

export type Role = User['role']

export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMINISTRATEUR: 50,
  RESPONSABLE_BIOMEDICAL: 40,
  TECHNICIEN: 30,
  PERSONNEL_SOIGNANT: 20,
  DIRECTION: 10,
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMINISTRATEUR: 'Administrateur',
  RESPONSABLE_BIOMEDICAL: 'Responsable biomédical',
  TECHNICIEN: 'Technicien',
  PERSONNEL_SOIGNANT: 'Personnel soignant',
  DIRECTION: 'Direction',
}

export const ROLE_COLORS: Record<Role, string> = {
  ADMINISTRATEUR: 'bg-red-100 text-red-800',
  RESPONSABLE_BIOMEDICAL: 'bg-blue-100 text-blue-800',
  TECHNICIEN: 'bg-green-100 text-green-800',
  PERSONNEL_SOIGNANT: 'bg-purple-100 text-purple-800',
  DIRECTION: 'bg-amber-100 text-amber-800',
}

export function hasRole(user: User | null, role: Role): boolean {
  if (!user) return false
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role]
}

export function isRole(user: User | null, role: Role): boolean {
  return user?.role === role
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'ADMINISTRATEUR'
}

export function canManageUsers(user: User | null): boolean {
  return isAdmin(user)
}

export function canManageEquipment(user: User | null): boolean {
  if (!user) return false
  return ['ADMINISTRATEUR', 'RESPONSABLE_BIOMEDICAL'].includes(user.role)
}

export function canQualifyFailure(user: User | null): boolean {
  return canManageEquipment(user)
}

export function canDiagnoseFailure(user: User | null): boolean {
  if (!user) return false
  return ['ADMINISTRATEUR', 'RESPONSABLE_BIOMEDICAL', 'TECHNICIEN'].includes(user.role)
}

export function canCloseFailure(user: User | null): boolean {
  return canManageEquipment(user)
}

export function canReportFailure(user: User | null): boolean {
  if (!user) return false
  return ['ADMINISTRATEUR', 'RESPONSABLE_BIOMEDICAL', 'TECHNICIEN', 'PERSONNEL_SOIGNANT'].includes(user.role)
}

export function canViewDashboard(user: User | null): boolean {
  return hasRole(user, 'PERSONNEL_SOIGNANT')
}

export function canViewIndicators(user: User | null): boolean {
  return hasRole(user, 'DIRECTION')
}
