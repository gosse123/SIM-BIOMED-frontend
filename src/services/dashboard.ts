import api from './api'
import { put, getAll } from './db'
import { network } from './network'

const CACHE_TTL = 10 * 60 * 1000

export interface DashboardData {
  equipements: {
    total: number
    fonctionnels: number
    en_panne: number
  }
  pannes: {
    ouvertes: number
    par_statut: Record<string, number>
    derniers_30_jours: number
  }
  maintenances: {
    en_retard: number
    dans_7_jours: number
  }
}

export const dashboardApi = {
  get: async (): Promise<DashboardData> => {
    if (network.isOnline()) {
      try {
        const { data } = await api.get('/dashboard/')
        await put('dashboard', 'dashboard-data', data, CACHE_TTL)
        return data
      } catch {
        const cached = await getAll<DashboardData>('dashboard')
        return cached.length > 0 ? cached[0] : {
          equipements: { total: 0, fonctionnels: 0, en_panne: 0 },
          pannes: { ouvertes: 0, par_statut: {}, derniers_30_jours: 0 },
          maintenances: { en_retard: 0, dans_7_jours: 0 },
        }
      }
    }
    const cached = await getAll<DashboardData>('dashboard')
    return cached.length > 0 ? cached[0] : {
      equipements: { total: 0, fonctionnels: 0, en_panne: 0 },
      pannes: { ouvertes: 0, par_statut: {}, derniers_30_jours: 0 },
      maintenances: { en_retard: 0, dans_7_jours: 0 },
    }
  },
}
