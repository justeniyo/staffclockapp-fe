/**
 * Shared helper functions used by both AuthContext and seedUsers bridge.
 * Extracted here to avoid circular imports.
 */

export const getFullName = (u) => {
  if (!u) return 'Unknown User'
  if (u.name) return u.name
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown User'
}

export const getUserInitials = (u) => {
  if (!u) return 'U'
  const f = u.firstName || '', l = u.lastName || ''
  if (!f && !l) return 'U'
  return (f.charAt(0) + l.charAt(0)).toUpperCase()
}

export const isCEO = (u) =>
  u?.role === 'ceo' || u?.subRole === 'ceo' || u?.accessLevel === 'ceo'

export const canAccessManagerPortal = (u) =>
  u?.isManager && (u?.role === 'staff' || u?.role === 'ceo')
