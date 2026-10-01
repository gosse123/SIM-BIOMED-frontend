import { isAxiosError } from 'axios'

/**
 * Vrai quand le serveur est injoignable ou en cours de démarrage :
 * - pas de réponse (coupure réseau, timeout, proxy qui refuse),
 * - 502/504 (API en veille / réveil du plan gratuit),
 * - 503 qui n'est pas le « Offline » synthétique du service worker.
 */
export function isServerUnavailable(err: unknown): boolean {
  if (!isAxiosError(err)) return false
  if (!err.response) return true
  const status = err.response.status
  if (status === 502 || status === 504) return true
  if (status === 503) {
    const data = err.response.data as { detail?: unknown } | undefined
    return data?.detail !== 'Offline'
  }
  return false
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    if (isServerUnavailable(err)) {
      return 'Le serveur est en cours de démarrage. Réessayez dans quelques secondes.'
    }
    const data = err.response?.data
    if (typeof data === 'string' && data.trim()) return data
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      const detail = record.detail
      if (typeof detail === 'string' && detail.trim()) return detail
      // DRF : {"non_field_errors": ["Identifiants incorrects."]}
      const nonField = record.non_field_errors
      if (Array.isArray(nonField) && typeof nonField[0] === 'string') return nonField[0]
      // DRF : {"username": ["Ce champ est obligatoire."]}
      const firstField = Object.values(record).find(
        (v) => Array.isArray(v) && typeof v[0] === 'string',
      )
      if (firstField) return (firstField as string[])[0]
      if (err.response) return JSON.stringify(data)
    }
    return fallback
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
