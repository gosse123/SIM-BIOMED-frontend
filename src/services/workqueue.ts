import api from './api'

export interface WorkQueueStats {
  total_ouvertes: number
  par_statut: Record<string, number>
  par_criticite: Record<string, number>
  pannes: WorkQueueItem[]
}

export interface WorkQueueItem {
  id: number
  equipement_nom: string
  equipement_num: string
  statut: string
  niveau_criticite: string
  date_signalement: string
  signale_par_nom: string
  description_signalement: string
}

export const workqueueApi = {
  get: async (): Promise<WorkQueueStats> => {
    const { data } = await api.get('/workqueue/')
    return data
  },
}
