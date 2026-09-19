import api from './api'
import type { Panne } from '@/types/panne'

export const panneApi = {
  list: async (params?: Record<string, string>) => {
    const { data } = await api.get('/pannes/', { params })
    return data
  },

  get: async (id: number): Promise<Panne> => {
    const { data } = await api.get(`/pannes/${id}/`)
    return data
  },

  report: async (payload: { equipement: number; description_signalement: string }): Promise<Panne> => {
    const { data } = await api.post('/pannes/', payload)
    return data
  },

  qualify: async (id: number, payload: { observation_qualification: string; critere_urgence: string }) => {
    const { data } = await api.post(`/pannes/${id}/qualify/`, payload)
    return data
  },

  evaluateCriticite: async (id: number, payload: { critere_impact: string; niveau_criticite: string }) => {
    const { data } = await api.post(`/pannes/${id}/evaluate-criticite/`, payload)
    return data
  },

  diagnose: async (id: number, payload: { description_diagnostic: string; cause_identifiee: string }) => {
    const { data } = await api.post(`/pannes/${id}/diagnose/`, payload)
    return data
  },

  startIntervention: async (id: number) => {
    const { data } = await api.post(`/pannes/${id}/start-intervention/`, {})
    return data
  },

  waitPiece: async (id: number) => {
    const { data } = await api.post(`/pannes/${id}/wait-piece/`, {})
    return data
  },

  waitPrestataire: async (id: number) => {
    const { data } = await api.post(`/pannes/${id}/wait-prestataire/`, {})
    return data
  },

  startTest: async (id: number, payload: { resultat_test: string }) => {
    const { data } = await api.post(`/pannes/${id}/start-test/`, payload)
    return data
  },

  close: async (id: number, payload: { commentaire_cloture?: string }) => {
    const { data } = await api.post(`/pannes/${id}/close/`, payload)
    return data
  },
}
