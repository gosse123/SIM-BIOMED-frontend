import { isAxiosError } from 'axios'

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data
    if (typeof data === 'string' && data.trim()) return data
    if (data && typeof data === 'object') {
      const detail = (data as Record<string, unknown>).detail
      if (typeof detail === 'string' && detail.trim()) return detail
      if (err.response) return JSON.stringify(data)
    }
    return fallback
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
