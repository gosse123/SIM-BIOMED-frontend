import api from './api'
import type { Equipment, Service, Localisation } from '@/types/equipment'

export const equipmentApi = {
  list: async (params?: Record<string, string>) => {
    const { data } = await api.get('/equipment/', { params })
    return data
  },

  get: async (id: number): Promise<Equipment> => {
    const { data } = await api.get(`/equipment/${id}/`)
    return data
  },

  create: async (equipment: Partial<Equipment>): Promise<Equipment> => {
    const { data } = await api.post('/equipment/', equipment)
    return data
  },

  update: async (id: number, equipment: Partial<Equipment>): Promise<Equipment> => {
    const { data } = await api.patch(`/equipment/${id}/`, equipment)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/equipment/${id}/`)
  },

  listServices: async (): Promise<Service[]> => {
    const { data } = await api.get('/services/')
    return data
  },

  listLocations: async (): Promise<Localisation[]> => {
    const { data } = await api.get('/locations/')
    return data
  },
}
