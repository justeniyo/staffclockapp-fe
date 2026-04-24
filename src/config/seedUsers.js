/**
 * Compatibility bridge.
 *
 * All helpers that pages import from 'src/config/seedUsers' are now
 * forwarded from AuthContext or defined inline.  Seed data objects are
 * still exported here so that any component referencing them during the
 * transition will get empty defaults rather than an import error.
 *
 * Components should gradually migrate to:
 *   import { useAuth } from '../context/AuthContext'
 * and use context values instead of direct seed-data access.
 */

export { getFullName, getUserInitials, isCEO, canAccessManagerPortal } from '../context/AuthContext'

// getUserById / getLocationById are now context methods accessed via useAuth().
// For static (non-hook) usage we provide stub implementations here that
// return null.  Pages should migrate to use the context versions.
export const getUserById = (_id) => null
export const getUserByEmail = (_email) => null
export const getLocationById = (_id) => null
export const getDepartmentById = (_id) => null
export const getManagerHierarchy = (_id) => []

// Seed data shells (empty) – prevents import crashes during migration
export const seedUsers = {}
export const seedLocations = {}
export const seedDepartments = {}
export const seedLeaveRequests = []
export const seedClockActivities = []

// Constants
export const LEAVE_TYPES = ['Annual', 'Sick', 'Emergency']
