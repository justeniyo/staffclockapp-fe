/** Compatibility bridge — reads from window.__sc_cache populated by AuthContext. */
export { getFullName, getUserInitials, isCEO, canAccessManagerPortal } from './helpers'

const cache = () => window.__sc_cache || {}
export const getUserById = (id) => id ? cache().usersById?.[id] ?? null : null
export const getUserByEmail = (e) => e ? cache().usersByEmail?.[e] ?? null : null
export const getLocationById = (id) => id ? cache().locations?.[id] ?? null : null
export const getDepartmentById = (id) => id ? cache().departments?.[id] ?? null : null
export const getManagerHierarchy = (id) => {
  const u = cache().usersById || {}, chain = []; let c = u[id]
  while (c?.managerId && chain.length < 10) { const m = u[c.managerId]; if (!m) break; chain.push(m); c = m }
  return chain
}
export const LEAVE_TYPES = ['Annual', 'Sick', 'Emergency']
