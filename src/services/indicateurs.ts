import api from './api'
import { put, getAll } from './db'
import { network } from './network'

const CACHE_TTL = 30 * 60 * 1000

export interface Indicateur {
  equipement_id: number
  nom: string
  num_inventaire: string
  nb_pannes: number
  mtbf_jours: number | null
  mttr_heures: number | null
}

export const indicateursApi = {
  get: async (): Promise<Indicateur[]> => {
    if (network.isOnline()) {
      try {
        const { data } = await api.get('/indicateurs/')
        await put('indicateurs', 'indicateurs-data', data, CACHE_TTL)
        return data
      } catch {
        const cached = await getAll<Indicateur[]>('indicateurs')
        return cached.length > 0 ? cached[0] : []
      }
    }
    const cached = await getAll<Indicateur[]>('indicateurs')
    return cached.length > 0 ? cached[0] : []
  },
}
