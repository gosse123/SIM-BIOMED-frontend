import api from './api'
import type { Intervention } from '@/types/intervention'

export const interventionApi = {
  list: async (params?: Record<string, string>) => {
    const { data } = await api.get('/interventions/', { params })
    return data
  },

  get: async (id: number): Promise<Intervention> => {
    const { data } = await api.get(`/interventions/${id}/`)
    return data
  },

  create: async (payload: {
    panne?: number
    equipement: number
    type_intervention: string
    description: string
    pieces_utilisees?: string
  }): Promise<Intervention> => {
    const { data } = await api.post('/interventions/', payload)
    return data
  },

  start: async (id: number): Promise<Intervention> => {
    const { data } = await api.post(`/interventions/${id}/start/`, {})
    return data
  },

  finish: async (id: number, payload: { temps_passe_minutes: number; pieces_utilisees?: string }): Promise<Intervention> => {
    const { data } = await api.post(`/interventions/${id}/finish/`, payload)
    return data
  },
}
