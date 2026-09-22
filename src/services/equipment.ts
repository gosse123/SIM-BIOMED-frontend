import api, { offlineAwareRequest } from './api'
import { put, get } from './db'
import type { Equipment, Service, Localisation } from '@/types/equipment'
import { normalizeList } from '@/types/api'
import { network } from './network'

const CACHE_TTL = 15 * 60 * 1000 // 15 min

export const equipmentApi = {
  list: async (params?: Record<string, string>): Promise<Equipment[]> => {
    const cacheKey = `equipment-list${params ? JSON.stringify(params) : ''}`

    if (network.isOnline()) {
      try {
        const { data } = await api.get('/equipment/', { params })
        await put('equipment', cacheKey, data, CACHE_TTL)
        return normalizeList<Equipment>(data)
      } catch {
        const cached = await get<Equipment[] | { results?: Equipment[] }>('equipment', cacheKey)
        return cached ? normalizeList<Equipment>(cached) : []
      }
    }

    const cached = await get<Equipment[] | { results?: Equipment[] }>('equipment', cacheKey)
    return cached ? normalizeList<Equipment>(cached) : []
  },

  get: async (id: number): Promise<Equipment> => {
    const cacheKey = `equipment-${id}`

    if (network.isOnline()) {
      try {
        const { data } = await api.get(`/equipment/${id}/`)
        await put('equipment', cacheKey, data, CACHE_TTL)
        return data
      } catch {
        const cached = await get<Equipment>('equipment', cacheKey)
        return cached || {} as Equipment
      }
    }

    const cached = await get<Equipment>('equipment', cacheKey)
    return cached || {} as Equipment
  },

  create: async (equipment: Partial<Equipment>): Promise<Equipment> => {
    const { data } = await offlineAwareRequest<Equipment>('post', '/equipment/', equipment)
    return data
  },

  update: async (id: number, equipment: Partial<Equipment>): Promise<Equipment> => {
    const { data } = await offlineAwareRequest<Equipment>('patch', `/equipment/${id}/`, equipment)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await offlineAwareRequest<void>('delete', `/equipment/${id}/`)
  },

  listServices: async (): Promise<Service[]> => {
    const cacheKey = 'services-list'
    if (network.isOnline()) {
      try {
        const { data } = await api.get('/services/')
        await put('services', cacheKey, data, CACHE_TTL)
        return normalizeList<Service>(data)
      } catch {
        const cached = await get<Service[] | { results?: Service[] }>('services', cacheKey)
        return cached ? normalizeList<Service>(cached) : []
      }
    }
    const cached = await get<Service[] | { results?: Service[] }>('services', cacheKey)
    return cached ? normalizeList<Service>(cached) : []
  },

  listLocations: async (): Promise<Localisation[]> => {
    const cacheKey = 'locations-list'
    if (network.isOnline()) {
      try {
        const { data } = await api.get('/locations/')
        await put('locations', cacheKey, data, CACHE_TTL)
        return normalizeList<Localisation>(data)
      } catch {
        const cached = await get<Localisation[] | { results?: Localisation[] }>('locations', cacheKey)
        return cached ? normalizeList<Localisation>(cached) : []
      }
    }
    const cached = await get<Localisation[] | { results?: Localisation[] }>('locations', cacheKey)
    return cached ? normalizeList<Localisation>(cached) : []
  },
}
