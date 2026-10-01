import api, { offlineAwareRequest } from './api'
import { put, get } from './db'
import type { MaintenancePlan, MaintenancePreventive } from '@/types/preventive'
import { normalizeList } from '@/types/api'
import { network } from './network'
import { isServerUnavailable } from '@/utils/errors'

const CACHE_TTL = 30 * 60 * 1000 // 30 min for preventive (less mutable)

export const preventiveApi = {
  listPlans: async (): Promise<MaintenancePlan[]> => {
    const cacheKey = 'plans-list'
    if (network.isOnline()) {
      try {
        const { data } = await api.get('/maintenance-plans/')
        await put('maintenance-plans', cacheKey, data, CACHE_TTL)
        return normalizeList<MaintenancePlan>(data)
      } catch (err) {
        if (!isServerUnavailable(err)) throw err
        const cached = await get<MaintenancePlan[] | { results?: MaintenancePlan[] }>('maintenance-plans', cacheKey)
        return cached ? normalizeList<MaintenancePlan>(cached) : []
      }
    }
    const cached = await get<MaintenancePlan[] | { results?: MaintenancePlan[] }>('maintenance-plans', cacheKey)
    return cached ? normalizeList<MaintenancePlan>(cached) : []
  },

  createPlan: async (plan: Partial<MaintenancePlan>): Promise<MaintenancePlan> => {
    const { data } = await offlineAwareRequest<MaintenancePlan>('post', '/maintenance-plans/', plan)
    return data
  },

  listPreventive: async (params?: Record<string, string>): Promise<MaintenancePreventive[]> => {
    const cacheKey = `preventive-list${params ? JSON.stringify(params) : ''}`
    if (network.isOnline()) {
      try {
        const { data } = await api.get('/maintenance-preventive/', { params })
        await put('maintenance-preventive', cacheKey, data, CACHE_TTL)
        return normalizeList<MaintenancePreventive>(data)
      } catch (err) {
        if (!isServerUnavailable(err)) throw err
        const cached = await get<MaintenancePreventive[] | { results?: MaintenancePreventive[] }>('maintenance-preventive', cacheKey)
        return cached ? normalizeList<MaintenancePreventive>(cached) : []
      }
    }
    const cached = await get<MaintenancePreventive[] | { results?: MaintenancePreventive[] }>('maintenance-preventive', cacheKey)
    return cached ? normalizeList<MaintenancePreventive>(cached) : []
  },

  createPreventive: async (payload: { plan: number; equipement: number; date_planifiee: string }): Promise<MaintenancePreventive> => {
    const { data } = await offlineAwareRequest<MaintenancePreventive>('post', '/maintenance-preventive/', payload)
    return data
  },

  start: async (id: number): Promise<MaintenancePreventive> => {
    const { data } = await offlineAwareRequest<MaintenancePreventive>('post', `/maintenance-preventive/${id}/start/`, {})
    return data
  },

  complete: async (id: number, payload: { commentaire?: string }): Promise<MaintenancePreventive> => {
    const { data } = await offlineAwareRequest<MaintenancePreventive>('post', `/maintenance-preventive/${id}/complete/`, payload)
    return data
  },

  finish: async (id: number, payload: { commentaire?: string }): Promise<MaintenancePreventive> => {
    const { data } = await offlineAwareRequest<MaintenancePreventive>('post', `/maintenance-preventive/${id}/complete/`, payload)
    return data
  },
}
