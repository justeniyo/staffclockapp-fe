/**
 * Pure data transformation functions — extracted from AuthContext for testability.
 * No React dependencies, no side effects.
 */
import { getFullName } from '../config/helpers'

const nameOf = (obj) => obj && typeof obj === 'object' ? obj.name : (obj || '')

export function normalizeUser(raw, { deptMap = {}, locMap = {} } = {}) {
  if (!raw) return null
  const u = { ...raw }

  if (u.department && typeof u.department === 'object') {
    u.departmentObj = u.department
    u.department = u.department.name || ''
  } else if (!u.department && u.departmentId && deptMap[u.departmentId]) {
    u.department = deptMap[u.departmentId].name
  }

  if (u.location && typeof u.location === 'object') {
    u.locationObj = u.location
    u.assignedLocationId = u.location.id || u.locationId
  } else {
    u.assignedLocationId = u.locationId || null
  }

  return {
    ...u,
    isManager: u.isManager ?? (u.role === 'ceo' || false),
    isClockedIn: u.isClockedIn ?? false,
    currentLocationIds: u.currentLocationIds ?? [],
    jobTitle: u.jobTitle ?? '',
    isActive: u.isActive ?? u.status === 'active',
    verified: u.verified ?? u.isVerified,
    assignedSite: u.assignedSite ?? u.locationObj?.name,
  }
}

export function attendanceToActivities(records) {
  const acts = []
  for (const r of records) {
    const staff = r.user || {}
    const base = {
      staffId: r.userId || staff.id,
      staffName: staff.firstName ? `${staff.firstName} ${staff.lastName || ''}`.trim() : 'Unknown',
      staffEmail: staff.email || '',
      department: nameOf(staff.department),
      locationId: r.locationId || (r.location && typeof r.location === 'object' ? r.location.id : null),
      location: nameOf(r.location),
    }
    if (r.clockIn)  acts.push({ ...base, id: `${r.id}_in`,  action: 'clock_in',  timestamp: r.clockIn })
    if (r.clockOut) acts.push({ ...base, id: `${r.id}_out`, action: 'clock_out', timestamp: r.clockOut })
  }
  return acts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export function enrichLeaveRequests(leaves, usersById) {
  return leaves.map((req) => {
    const staff = req.user || usersById[req.userId] || null
    const reviewer = req.reviewer || (req.reviewedBy ? usersById[req.reviewedBy] : null)
    return {
      ...req,
      staffId: req.userId || staff?.id,
      staffName: staff ? getFullName(staff) : 'Unknown Staff',
      staffEmail: staff?.email || '',
      department: nameOf(staff?.department),
      manager: staff?.managerId || null,
      type: req.type ? req.type.charAt(0).toUpperCase() + req.type.slice(1) : req.type,
      processedByName: reviewer ? getFullName(reviewer) : null,
      requestDate: req.createdAt || req.requestDate,
      processedDate: req.reviewedAt || req.processedDate,
      processingNotes: req.reviewNotes || req.processingNotes,
      processedBy: req.reviewedBy || req.processedBy,
    }
  })
}

/** Resolve a value that might be a numeric ID, email, or name → numeric ID */
export function resolveId(val, lookup) {
  if (!val) return undefined
  if (typeof val === 'number') return val
  const n = Number(val)
  if (!isNaN(n) && n > 0) return n
  // Try lookup map (email → obj, or name → obj)
  if (lookup) {
    const direct = lookup[val]
    if (direct?.id) return direct.id
    // Search by name
    const byName = Object.values(lookup).find(o =>
      (o.firstName && `${o.firstName} ${o.lastName}`.toLowerCase() === val.toLowerCase()) ||
      (o.name && o.name.toLowerCase() === val.toLowerCase())
    )
    if (byName?.id) return byName.id
  }
  return undefined
}

/** Strip undefined keys from an object (for API payloads) */
export const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
