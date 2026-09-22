/**
 * DRF paginated response wrapper.
 * Backend returns { count, next, previous, results } when pagination is enabled.
 */
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/**
 * Normalize an API list response.
 * Backend may return a plain array or a PaginatedResponse depending on the ViewSet.
 * This helper always returns a plain array.
 */
export function normalizeList<T>(data: T[] | { results?: T[] }): T[] {
  if (Array.isArray(data)) return data
  return data.results ?? []
}
