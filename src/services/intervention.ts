import api, { offlineAwareRequest } from './api'
import { put, get } from './db'
import type { Intervention } from '@/types/intervention'
import { normalizeList } from '@/types/api'
import { network } from './network'
import { isServerUnavailable } from '@/utils/errors'

const CACHE_TTL = 10 * 60 * 1000

export const interventionApi = {
  list: async (params?: Record<string, string>): Promise<Intervention[]> => {
    const cacheKey = `interventions-list${params ? JSON.stringify(params) : ''}`

    if (network.isOnline()) {
      try {
        const { data } = await api.get('/interventions/', { params })
        await put('interventions', cacheKey, data, CACHE_TTL)
        return normalizeList<Intervention>(data)
      } catch (err) {
        if (!isServerUnavailable(err)) throw err
        const cached = await get<Intervention[] | { results?: Intervention[] }>('interventions', cacheKey)
        return cached ? normalizeList<Intervention>(cached) : []
      }
    }

    const cached = await get<Intervention[] | { results?: Intervention[] }>('interventions', cacheKey)
    return cached ? normalizeList<Intervention>(cached) : []
  },

  get: async (id: number): Promise<Intervention> => {
    const cacheKey = `intervention-${id}`

    if (network.isOnline()) {
      try {
        const { data } = await api.get(`/interventions/${id}/`)
        await put('interventions', cacheKey, data, CACHE_TTL)
        return data
      } catch (err) {
        if (!isServerUnavailable(err)) throw err
        const cached = await get<Intervention>('interventions', cacheKey)
        return cached || {} as Intervention
      }
    }

    const cached = await get<Intervention>('interventions', cacheKey)
    return cached || {} as Intervention
  },

  create: async (payload: {
    panne?: number
    equipement: number
    type_intervention: string
    description: string
    pieces_utilisees?: string
    hors_service_total?: boolean
  }): Promise<Intervention> => {
    const { data } = await offlineAwareRequest<Intervention>('post', '/interventions/', payload)
    return data
  },

  start: async (id: number): Promise<Intervention> => {
    const { data } = await offlineAwareRequest<Intervention>('post', `/interventions/${id}/start/`, {})
    return data
  },

  finish: async (
    id: number,
    payload: { temps_passe_minutes: number; pieces_utilisees?: string; repare_totalement?: boolean },
  ): Promise<Intervention> => {
    const { data } = await offlineAwareRequest<Intervention>('post', `/interventions/${id}/finish/`, payload)
    return data
  },

  cancel: async (id: number): Promise<Intervention> => {
    const { data } = await offlineAwareRequest<Intervention>('post', `/interventions/${id}/cancel/`, {})
    return data
  },
}
