interface MaybeNamed {
  first_name?: string | null
  last_name?: string | null
  username?: string | null
}

export function userDisplayName(user?: MaybeNamed | null): string {
  if (!user) return ''
  const full = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
  return full || user.username || ''
}
