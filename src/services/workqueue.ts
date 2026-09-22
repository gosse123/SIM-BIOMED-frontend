import api from './api'
import { put, getAll } from './db'
import { network } from './network'

const CACHE_TTL = 10 * 60 * 1000

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
    if (network.isOnline()) {
      try {
        const { data } = await api.get('/workqueue/')
        await put('workqueue', 'workqueue-stats', data, CACHE_TTL)
        return data
      } catch {
        const cached = await getAll<WorkQueueStats>('workqueue')
        return cached.length > 0 ? cached[0] : { total_ouvertes: 0, par_statut: {}, par_criticite: {}, pannes: [] }
      }
    }
    const cached = await getAll<WorkQueueStats>('workqueue')
    return cached.length > 0 ? cached[0] : { total_ouvertes: 0, par_statut: {}, par_criticite: {}, pannes: [] }
  },
}
