import api from './api'

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
    const { data } = await api.get('/indicateurs/')
    return data
  },
}
