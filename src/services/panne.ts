import api, { offlineAwareRequest } from './api'
import { put, get } from './db'
import type { Panne } from '@/types/panne'
import { normalizeList } from '@/types/api'
import { network } from './network'
import { isServerUnavailable } from '@/utils/errors'

const CACHE_TTL = 10 * 60 * 1000 // 10 min (shorter for mutable data)

export const panneApi = {
  list: async (params?: Record<string, string>): Promise<Panne[]> => {
    const cacheKey = `pannes-list${params ? JSON.stringify(params) : ''}`

    if (network.isOnline()) {
      try {
        const { data } = await api.get('/pannes/', { params })
        await put('pannes', cacheKey, data, CACHE_TTL)
        return normalizeList<Panne>(data)
      } catch (err) {
        if (!isServerUnavailable(err)) throw err
        const cached = await get<Panne[] | { results?: Panne[] }>('pannes', cacheKey)
        return cached ? normalizeList<Panne>(cached) : []
      }
    }

    const cached = await get<Panne[] | { results?: Panne[] }>('pannes', cacheKey)
    return cached ? normalizeList<Panne>(cached) : []
  },

  get: async (id: number): Promise<Panne> => {
    const cacheKey = `panne-${id}`

    if (network.isOnline()) {
      try {
        const { data } = await api.get(`/pannes/${id}/`)
        await put('pannes', cacheKey, data, CACHE_TTL)
        return data
      } catch (err) {
        if (!isServerUnavailable(err)) throw err
        const cached = await get<Panne>('pannes', cacheKey)
        return cached || {} as Panne
      }
    }

    const cached = await get<Panne>('pannes', cacheKey)
    return cached || {} as Panne
  },

  report: async (payload: { equipement: number; description_signalement: string }): Promise<Panne> => {
    const { data } = await offlineAwareRequest<Panne>('post', '/pannes/', payload)
    return data
  },

  qualify: async (id: number, payload: { observation_qualification: string; critere_urgence: string }) => {
    const { data } = await offlineAwareRequest('post', `/pannes/${id}/qualify/`, payload)
    return data
  },

  evaluateCriticite: async (id: number, payload: { critere_impact: string; niveau_criticite: string }) => {
    const { data } = await offlineAwareRequest('post', `/pannes/${id}/evaluate-criticite/`, payload)
    return data
  },

  diagnose: async (id: number, payload: { description_diagnostic: string; cause_identifiee: string }) => {
    const { data } = await offlineAwareRequest('post', `/pannes/${id}/diagnose/`, payload)
    return data
  },

  startIntervention: async (id: number) => {
    const { data } = await offlineAwareRequest('post', `/pannes/${id}/start-intervention/`, {})
    return data
  },

  waitPiece: async (id: number) => {
    const { data } = await offlineAwareRequest('post', `/pannes/${id}/wait-piece/`, {})
    return data
  },

  waitPrestataire: async (id: number) => {
    const { data } = await offlineAwareRequest('post', `/pannes/${id}/wait-prestataire/`, {})
    return data
  },

  startTest: async (id: number, payload: { resultat_test: string }) => {
    const { data } = await offlineAwareRequest('post', `/pannes/${id}/start-test/`, payload)
    return data
  },

  close: async (id: number, payload: { commentaire_cloture?: string }) => {
    const { data } = await offlineAwareRequest('post', `/pannes/${id}/close/`, payload)
    return data
  },

  // Prise en charge : sans argument → affectation à l'utilisateur courant ;
  // { utilisateur: null } → désaffectation (RB-PR-004).
  affecter: async (id: number, utilisateur?: number | null) => {
    const payload = utilisateur === undefined ? {} : { utilisateur }
    const { data } = await offlineAwareRequest('post', `/pannes/${id}/affecter/`, payload)
    return data
  },
}
