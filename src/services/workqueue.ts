import api from './api'
import { put, getAll } from './db'
import { network } from './network'
import { isServerUnavailable } from '@/utils/errors'

const CACHE_TTL = 10 * 60 * 1000

export interface WorkQueueTechnicien {
  id: number
  nom: string
  initiales: string
  interventions_en_cours: number
  charge: number
}

export interface WorkQueueStats {
  total_ouvertes: number
  par_statut: Record<string, number>
  par_criticite: Record<string, number>
  pannes: WorkQueueItem[]
  age_moyen_minutes?: number | null
  techniciens?: WorkQueueTechnicien[]
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
  service_nom?: string | null
  cause_identifiee?: string
  transitions_valides?: string[]
  affecte_a?: number | null
  affecte_a_nom?: string | null
}

export const workqueueApi = {
  get: async (): Promise<WorkQueueStats> => {
    if (network.isOnline()) {
      try {
        const { data } = await api.get('/workqueue/')
        await put('workqueue', 'workqueue-stats', data, CACHE_TTL)
        return data
      } catch (err) {
        if (!isServerUnavailable(err)) throw err
        const cached = await getAll<WorkQueueStats>('workqueue')
        return cached.length > 0 ? cached[0] : { total_ouvertes: 0, par_statut: {}, par_criticite: {}, pannes: [] }
      }
    }
    const cached = await getAll<WorkQueueStats>('workqueue')
    return cached.length > 0 ? cached[0] : { total_ouvertes: 0, par_statut: {}, par_criticite: {}, pannes: [] }
  },
}
