import api from './api'
import type { MaintenancePlan, MaintenancePreventive } from '@/types/preventive'

export const preventiveApi = {
  listPlans: async (): Promise<MaintenancePlan[]> => {
    const { data } = await api.get('/maintenance-plans/')
    return data
  },

  createPlan: async (plan: Partial<MaintenancePlan>): Promise<MaintenancePlan> => {
    const { data } = await api.post('/maintenance-plans/', plan)
    return data
  },

  listPreventive: async (params?: Record<string, string>) => {
    const { data } = await api.get('/maintenance-preventive/', { params })
    return data
  },

  createPreventive: async (payload: { plan: number; equipement: number; date_planifiee: string }): Promise<MaintenancePreventive> => {
    const { data } = await api.post('/maintenance-preventive/', payload)
    return data
  },

  start: async (id: number): Promise<MaintenancePreventive> => {
    const { data } = await api.post(`/maintenance-preventive/${id}/start/`, {})
    return data
  },

  finish: async (id: number, payload: { commentaire?: string }): Promise<MaintenancePreventive> => {
    const { data } = await api.post(`/maintenance-preventive/${id}/finish/`, payload)
    return data
  },
}
