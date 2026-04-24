import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService, attendanceService, leaveService, userService, departmentService, locationService } from '../services'
import { getToken, setToken, clearAuth } from '../services/api.js'

/* ═══════════════════════════════════════════════
   EXPORTED HELPERS  (unchanged interface)
   ═══════════════════════════════════════════════ */

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

const LEAVE_TYPES = ['Annual', 'Sick', 'Emergency']

/* ═══════════════════════════════════════════════
   INTERNAL MAPPING HELPERS
   ═══════════════════════════════════════════════ */

const capitalizeType = (t) => t ? t.charAt(0).toUpperCase() + t.slice(1) : t
const lowercaseType = (t) => t ? t.toLowerCase() : t

function normalizeUser(raw, { deptMap = {}, locMap = {} } = {}) {
  if (!raw) return null
  const u = { ...raw }

  // department: flatten object → string
  if (u.department && typeof u.department === 'object') {
    u.departmentObj = u.department
    u.department = u.department.name || ''
  } else if (!u.department && u.departmentId && deptMap[u.departmentId]) {
    u.department = deptMap[u.departmentId].name
  }

  // location: flatten + alias
  if (u.location && typeof u.location === 'object') {
    u.locationObj = u.location
    u.assignedLocationId = u.location.id || u.locationId
  } else {
    u.assignedLocationId = u.locationId || null
  }

  // Synthetic fields the frontend expects
  if (u.isManager === undefined) u.isManager = isCEO(u) || false
  if (u.isClockedIn === undefined) u.isClockedIn = false
  if (u.currentLocationIds === undefined) u.currentLocationIds = []
  if (u.jobTitle === undefined) u.jobTitle = ''
  if (u.isActive === undefined) u.isActive = u.status === 'active'
  if (u.verified === undefined) u.verified = u.isVerified
  if (u.assignedSite === undefined && u.locationObj) u.assignedSite = u.locationObj.name

  return u
}

function attendanceToActivities(records) {
  const activities = []
  for (const r of records) {
    const staff = r.user || {}
    const deptName = staff.department && typeof staff.department === 'object' ? staff.department.name : (staff.department || '')
    const locName = r.location && typeof r.location === 'object' ? r.location.name : (r.location || '')
    const base = {
      staffId: r.userId || staff.id,
      staffName: staff.firstName ? `${staff.firstName} ${staff.lastName || ''}`.trim() : 'Unknown',
      staffEmail: staff.email || '',
      department: deptName,
      locationId: r.locationId || (r.location && typeof r.location === 'object' ? r.location.id : null),
      locationName: locName,
      location: locName,
    }
    if (r.clockIn)  activities.push({ ...base, id: `${r.id}_in`,  action: 'clock_in',  timestamp: r.clockIn })
    if (r.clockOut) activities.push({ ...base, id: `${r.id}_out`, action: 'clock_out', timestamp: r.clockOut })
  }
  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

function enrichLeaveRequests(leaves, usersById) {
  return leaves.map((req) => {
    const staff = req.user || usersById[req.userId] || null
    const reviewer = req.reviewer || (req.reviewedBy ? usersById[req.reviewedBy] : null)
    const deptName = staff?.department && typeof staff.department === 'object' ? staff.department.name : (staff?.department || '')

    return {
      ...req,
      staffId: req.userId || staff?.id,
      staffName: staff ? getFullName(staff) : 'Unknown Staff',
      staffEmail: staff?.email || '',
      department: deptName,
      manager: staff?.managerId || null,
      type: capitalizeType(req.type),
      processedByName: reviewer ? getFullName(reviewer) : null,
      startDate: req.startDate,
      endDate: req.endDate,
      requestDate: req.createdAt || req.requestDate,
      processedDate: req.reviewedAt || req.processedDate,
      processingNotes: req.reviewNotes || req.processingNotes,
      processedBy: req.reviewedBy || req.processedBy,
    }
  })
}

/* ═══════════════════════════════════════════════
   CONTEXT
   ═══════════════════════════════════════════════ */

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const routeLocation = useLocation()

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sc_user')
    return saved ? JSON.parse(saved) : null
  })

  const [allUsersMap, setAllUsersMap] = useState({})
  const [allUsersById, setAllUsersById] = useState({})
  const [departments, setDepartments] = useState({})
  const [locations, setLocations] = useState({})
  const [rawLeaves, setRawLeaves] = useState([])
  const [rawAttendance, setRawAttendance] = useState([])
  const [filterStates, setFilterStates] = useState(() => {
    const saved = localStorage.getItem('sc_filter_states')
    return saved ? JSON.parse(saved) : {}
  })

  const loadingRef = useRef(false)

  useEffect(() => {
    if (user) localStorage.setItem('sc_user', JSON.stringify(user))
    else localStorage.removeItem('sc_user')
  }, [user])

  useEffect(() => {
    localStorage.setItem('sc_filter_states', JSON.stringify(filterStates))
  }, [filterStates])

  /* ── DATA LOADING ── */

  const loadAllData = useCallback(async () => {
    if (!user || !getToken() || loadingRef.current) return
    loadingRef.current = true

    try {
      // 1. Departments + locations (all roles)
      const [deptRes, locRes] = await Promise.all([
        departmentService.getAll({ limit: 100 }).catch(() => ({ data: [] })),
        locationService.getAll({ limit: 100 }).catch(() => ({ data: [] })),
      ])

      const deptMap = {}
      ;(deptRes.data || []).forEach(d => { deptMap[d.id] = d })
      setDepartments(deptMap)

      const locMap = {}
      ;(locRes.data || []).forEach(l => { locMap[l.id] = l })
      setLocations(locMap)

      // 2. Users (admin, CEO, managers, security need full list; staff need at minimum their manager)
      const needsAllUsers = user.role === 'admin' || isCEO(user) || user.role === 'security' || user.isManager
      let byEmail = {}, byId = {}

      if (needsAllUsers) {
        const usersRes = await userService.getAll({ limit: 500 }).catch(() => ({ data: [] }))
        ;(usersRes.data || []).forEach(u => {
          const norm = normalizeUser(u, { deptMap, locMap })
          byEmail[norm.email] = norm
          byId[norm.id] = norm
        })
        // Derive isManager from who has direct reports
        const managerIds = new Set(Object.values(byId).filter(u => u.managerId).map(u => u.managerId))
        managerIds.forEach(mid => {
          if (byId[mid]) byId[mid].isManager = true
          const ek = Object.keys(byEmail).find(e => byEmail[e]?.id === mid)
          if (ek) byEmail[ek].isManager = true
        })
      }

      setAllUsersMap(byEmail)
      setAllUsersById(byId)

      // 3. Leave requests
      let leavesArr = []
      if (user.role === 'admin' || isCEO(user) || user.isManager) {
        const res = await leaveService.getAll({ limit: 500 }).catch(() => ({ data: [] }))
        leavesArr = res.data || []
      } else {
        const res = await leaveService.getMyLeaves({ limit: 200 }).catch(() => ({ data: [] }))
        leavesArr = res.data || []
      }
      setRawLeaves(leavesArr)

      // 4. Attendance records → clock activities
      let attArr = []
      if (user.role === 'admin' || isCEO(user)) {
        const res = await attendanceService.getAll({ limit: 500 }).catch(() => ({ data: [] }))
        attArr = res.data || []
      } else {
        const res = await attendanceService.getMyRecords({ limit: 200 }).catch(() => ({ data: [] }))
        attArr = res.data || []
      }
      setRawAttendance(attArr)

      // 5. Sync clock status
      try {
        const statusRes = await attendanceService.getStatus()
        const s = statusRes.data || statusRes
        setUser(prev => prev ? {
          ...prev,
          isClockedIn: s.status !== 'clocked_out',
          currentLocationIds: s.attendance?.locationId ? [s.attendance.locationId] : [],
        } : prev)
      } catch { /* not critical */ }

    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      loadingRef.current = false
    }
  }, [user?.id, user?.role, user?.isManager])

  useEffect(() => {
    if (user && getToken()) loadAllData()
  }, [user?.id, loadAllData])

  useEffect(() => {
    if (getToken() && user) {
      authService.verifyToken().catch(() => { clearAuth(); setUser(null) })
    }
  }, [])

  /* ── DERIVED DATA ── */

  const leaveRequests = useMemo(() => enrichLeaveRequests(rawLeaves, allUsersById), [rawLeaves, allUsersById])
  const clockActivities = useMemo(() => attendanceToActivities(rawAttendance), [rawAttendance])
  const isOnManager = routeLocation.pathname.startsWith('/manager')

  /* ── FILTER HELPERS ── */

  const saveFilterState = (page, filters) => setFilterStates(prev => ({ ...prev, [page]: filters }))
  const getFilterState = (page) => filterStates[page] || {}

  /* ── LOOKUP HELPERS ── */

  const getUserById = useCallback((id) => allUsersById[id] || null, [allUsersById])
  const getLocationById = useCallback((id) => locations[id] || null, [locations])

  /* ── AUTH ── */

  const login = async ({ email, password, roleHint }) => {
    const res = await authService.login(email, password)
    const raw = res.data?.user || res.data || res.user
    if (!raw) throw new Error('Invalid response from server')

    if (roleHint === 'ceo' && !isCEO(raw)) throw new Error('Wrong portal for this user')
    if (roleHint === 'staff' && raw.role !== 'staff' && raw.role !== 'ceo') throw new Error('Wrong portal for this user')
    if (roleHint && !['ceo', 'staff'].includes(roleHint) && roleHint !== raw.role) throw new Error('Wrong portal for this user')

    const normalized = normalizeUser({ ...raw, email })
    setUser(normalized)

    if (isCEO(normalized)) navigate('/ceo-dashboard', { replace: true })
    else if (normalized.role === 'staff') navigate('/clock', { replace: true })
    else if (normalized.role === 'admin') navigate('/admin-dashboard', { replace: true })
    else if (normalized.role === 'security') navigate('/security-dashboard', { replace: true })
  }

  const logout = async () => {
    try { await authService.logout() } catch {}
    setUser(null); setAllUsersMap({}); setAllUsersById({}); setRawLeaves([]); setRawAttendance([])
    navigate('/staff', { replace: true })
  }

  const forgotPassword = async (email) => authService.forgotPassword(email)
  const resetPassword = async (email, token, newPassword) => authService.resetPassword(token, newPassword)
  const verifyOTP = async (email, otp) => authService.verifyEmail(otp)
  const resendOTP = async (email, type = 'verification') => authService.resendVerification(email)

  /* ── CLOCK ── */

  const clockIn = async (locationId) => {
    const res = await attendanceService.clockIn(locationId)
    setUser(prev => prev ? { ...prev, isClockedIn: true, currentLocationIds: [locationId] } : prev)
    loadAllData()
    return res
  }

  const clockOut = async () => {
    const res = await attendanceService.clockOut()
    setUser(prev => prev ? { ...prev, isClockedIn: false, currentLocationIds: [] } : prev)
    loadAllData()
    return res
  }

  const addLocation = async (locationId) => {
    await attendanceService.clockOut()
    const res = await attendanceService.clockIn(locationId)
    setUser(prev => prev ? { ...prev, currentLocationIds: [locationId] } : prev)
    loadAllData()
    return { success: true, location: locations[locationId]?.name }
  }

  const removeLocation = async () => clockOut()

  /* ── LEAVE ── */

  const submitLeaveRequest = async (requestData) => {
    const res = await leaveService.create({
      type: lowercaseType(requestData.type),
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      reason: requestData.reason,
    })
    loadAllData()
    return res.data || res
  }

  const updateLeaveRequest = async (requestId, updatedData) => {
    await leaveService.cancel(requestId)
    return submitLeaveRequest(updatedData)
  }

  const processLeaveRequest = async (requestId, status, notes) => {
    let res
    if (status === 'approved') res = await leaveService.approve(requestId, notes)
    else if (status === 'rejected') res = await leaveService.reject(requestId, notes)
    loadAllData()
    return res
  }

  /* ── USER MANAGEMENT ── */

  const registerStaff = async (staffData) => {
    const res = await userService.create({
      firstName: staffData.firstName, lastName: staffData.lastName,
      email: staffData.email, password: 'Temp1234!',
      phone: staffData.phone, role: staffData.role || 'staff',
      departmentId: staffData.departmentId || staffData.department,
      locationId: staffData.assignedLocationId, managerId: staffData.managerId,
    })
    await loadAllData()
    return res.data || res
  }

  const updateStaff = async (emailOrId, updates) => {
    const u = allUsersMap[emailOrId] || allUsersById[emailOrId]
    await userService.update(u?.id || emailOrId, updates)
    await loadAllData()
  }

  const deactivateUser = async (email) => {
    const u = allUsersMap[email]; if (!u) throw new Error('User not found')
    await userService.update(u.id, { status: 'suspended' }); await loadAllData()
    return { success: true }
  }

  const reactivateUser = async (email) => {
    const u = allUsersMap[email]; if (!u) throw new Error('User not found')
    await userService.update(u.id, { status: 'active' }); await loadAllData()
    return { success: true }
  }

  /* ── DEPT / LOCATION ── */

  const createDepartment = async (d) => { const r = await departmentService.create(d); await loadAllData(); return r.data || r }
  const updateDepartment = async (id, d) => { await departmentService.update(id, d); await loadAllData(); return { success: true } }
  const deactivateDepartment = async (id) => { await departmentService.remove(id); await loadAllData(); return { success: true } }
  const createLocation = async (d) => { const r = await locationService.create(d); await loadAllData(); return r.data || r }
  const updateLocation = async (id, d) => { await locationService.update(id, d); await loadAllData(); return { success: true } }
  const deactivateLocation = async (id) => { await locationService.remove(id); await loadAllData(); return { success: true } }

  /* ── SECURITY ── */

  const getStaffForSite = (locationId) => {
    if (user?.role !== 'security') return []
    return Object.values(allUsersById).filter(s =>
      s.role === 'staff' && s.isActive && s.isClockedIn &&
      (s.assignedLocationId == locationId || s.locationId == locationId)
    )
  }

  /* ── CONTEXT VALUE ── */

  const allUsers = allUsersMap

  const value = useMemo(() => ({
    user, login, logout, forgotPassword, resetPassword, resendOTP, verifyOTP,
    clockIn, clockOut, addLocation, removeLocation,
    isOnManager,
    leaveRequests, submitLeaveRequest, updateLeaveRequest, processLeaveRequest,
    rawLeaveRequests: leaveRequests,
    clockActivities, rawClockActivities: clockActivities,
    allUsers, locations, departments,
    registerStaff, updateStaff, deactivateUser, reactivateUser,
    createDepartment, updateDepartment, deactivateDepartment,
    createLocation, updateLocation, deactivateLocation,
    getStaffForSite,
    filterStates, saveFilterState, getFilterState,
    activeOTPs: {}, LEAVE_TYPES,
    getUserById, getLocationById,
    refreshData: loadAllData,
  }), [
    user, isOnManager, leaveRequests, clockActivities,
    allUsers, locations, departments, filterStates,
    getUserById, getLocationById, loadAllData,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
