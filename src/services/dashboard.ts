import api from './api'

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
    const { data } = await api.get('/dashboard/')
    return data
  },
}
