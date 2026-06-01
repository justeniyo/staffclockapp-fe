import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService, attendanceService, leaveService, userService, departmentService, locationService } from '../services'
import { getToken, setToken, clearAuth } from '../services/api.js'
import { getFullName, getUserInitials, isCEO, canAccessManagerPortal } from '../config/helpers'
import { normalizeUser, attendanceToActivities, enrichLeaveRequests, resolveId, compact } from '../utils/transforms'

export { getFullName, getUserInitials, isCEO, canAccessManagerPortal }

const LEAVE_TYPES = ['Annual', 'Sick', 'Emergency']
const LANDING = { ceo: '/ceo-dashboard', admin: '/admin-dashboard', security: '/security-dashboard', staff: '/clock' }
const safe = (promise) => promise.catch(() => ({ data: [] }))

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const routeLocation = useLocation()

  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('sc_user')) } catch { return null } })
  const [allUsersMap, setAllUsersMap] = useState({})
  const [allUsersById, setAllUsersById] = useState({})
  const [departments, setDepartments] = useState({})
  const [locations, setLocations] = useState({})
  const [rawLeaves, setRawLeaves] = useState([])
  const [rawAttendance, setRawAttendance] = useState([])
  const [filterStates, setFilterStates] = useState(() => { try { return JSON.parse(localStorage.getItem('sc_filter_states')) || {} } catch { return {} } })
  const loadingRef = useRef(false)

  // Persist state
  useEffect(() => { user ? localStorage.setItem('sc_user', JSON.stringify(user)) : localStorage.removeItem('sc_user') }, [user])
  useEffect(() => { localStorage.setItem('sc_filter_states', JSON.stringify(filterStates)) }, [filterStates])


  const loadAllData = useCallback(async () => {
    if (!user || !getToken() || loadingRef.current) return
    loadingRef.current = true
    try {
      const [deptRes, locRes] = await Promise.all([safe(departmentService.getAll({ limit: 100 })), safe(locationService.getAll({ limit: 100 }))])

      const deptMap = Object.fromEntries((deptRes.data || []).map(d => [d.id, d]))
      const locMap  = Object.fromEntries((locRes.data || []).map(l => [l.id, l]))
      setDepartments(deptMap)
      setLocations(locMap)

      // Users
      const needsAll = ['admin', 'security'].includes(user.role) || isCEO(user) || user.isManager
      let byEmail = {}, byId = {}
      if (needsAll) {
        const res = await safe(userService.getAll({ limit: 100 }))
        for (const u of res.data || []) {
          const norm = normalizeUser(u, { deptMap, locMap })
          byEmail[norm.email] = norm
          byId[norm.id] = norm
        }
        // Derive isManager from direct reports
        const mgrIds = new Set(Object.values(byId).filter(u => u.managerId).map(u => u.managerId))
        for (const mid of mgrIds) { if (byId[mid]) byId[mid].isManager = true; const e = Object.keys(byEmail).find(k => byEmail[k]?.id === mid); if (e) byEmail[e].isManager = true }
      }
      setAllUsersMap(byEmail); setAllUsersById(byId)
      window.__sc_cache = { usersById: byId, usersByEmail: byEmail, locations: locMap, departments: deptMap }

      // Leaves
      const isPrivileged = user.role === 'admin' || isCEO(user) || user.isManager
      const leavesRes = await safe(isPrivileged ? leaveService.getAll({ limit: 100 }) : leaveService.getMyLeaves({ limit: 100 }))
      setRawLeaves(leavesRes.data || [])

      // Attendance
      const isAdmin = user.role === 'admin' || isCEO(user)
      const attRes = await safe(isAdmin ? attendanceService.getAll({ limit: 100 }) : attendanceService.getMyRecords({ limit: 100 }))
      setRawAttendance(attRes.data || [])

      // Sync clock status
      try {
        const s = (await attendanceService.getStatus()).data || {}
        setUser(prev => prev ? { ...prev, isClockedIn: s.status !== 'clocked_out', currentLocationIds: s.attendance?.locationId ? [s.attendance.locationId] : [] } : prev)
      } catch { /* optional */ }
    } catch (err) { console.error('Data load failed:', err) }
    finally { loadingRef.current = false }
  }, [user?.id, user?.role, user?.isManager])

  useEffect(() => { if (user && getToken()) loadAllData() }, [user?.id, loadAllData])
  useEffect(() => { if (getToken() && user) authService.verifyToken().catch(() => { clearAuth(); setUser(null) }) }, [])


  const leaveRequests  = useMemo(() => enrichLeaveRequests(rawLeaves, allUsersById), [rawLeaves, allUsersById])
  const clockActivities = useMemo(() => attendanceToActivities(rawAttendance), [rawAttendance])
  const isOnManager = routeLocation.pathname.startsWith('/manager')


  const login = async ({ email, password, roleHint }) => {
    const res = await authService.login(email, password)
    const raw = res.data?.user || res.data || res.user
    if (!raw) throw new Error('Invalid response from server')
    if (roleHint === 'ceo' && !isCEO(raw)) throw new Error('Wrong portal for this user')
    if (roleHint && roleHint !== 'ceo' && roleHint !== 'staff' && roleHint !== raw.role) throw new Error('Wrong portal for this user')
    if (roleHint === 'staff' && raw.role !== 'staff' && raw.role !== 'ceo') throw new Error('Wrong portal for this user')

    const normalized = normalizeUser({ ...raw, email })
    setUser(normalized)
    navigate(isCEO(normalized) ? LANDING.ceo : LANDING[normalized.role] || '/clock', { replace: true })
  }

  const logout = async () => {
    try { await authService.logout() } catch {}
    setUser(null); setAllUsersMap({}); setAllUsersById({}); setRawLeaves([]); setRawAttendance([])
    window.__sc_cache = {}
    navigate('/staff', { replace: true })
  }


  const withReload = (fn) => async (...args) => { const r = await fn(...args); loadAllData(); return r }

  const clockIn = async (locId) => {
    const r = await attendanceService.clockIn(locId)
    setUser(p => p ? { ...p, isClockedIn: true, currentLocationIds: [locId] } : p)
    loadAllData(); return r
  }
  const clockOut = async () => {
    const r = await attendanceService.clockOut()
    setUser(p => p ? { ...p, isClockedIn: false, currentLocationIds: [] } : p)
    loadAllData(); return r
  }
  const addLocation = async (locId) => { await attendanceService.clockOut(); const r = await attendanceService.clockIn(locId); setUser(p => p ? { ...p, currentLocationIds: [locId] } : p); loadAllData(); return { success: true, location: locations[locId]?.name } }
  const removeLocation = () => clockOut()


  const submitLeaveRequest = async (d) => { const r = await leaveService.create({ type: d.type?.toLowerCase(), startDate: d.startDate, endDate: d.endDate, reason: d.reason }); loadAllData(); return r.data || r }
  const updateLeaveRequest = async (id, d) => { await leaveService.cancel(id); return submitLeaveRequest(d) }
  const processLeaveRequest = async (id, status, notes) => { const r = await (status === 'approved' ? leaveService.approve(id, notes) : leaveService.reject(id, notes)); loadAllData(); return r }


  const registerStaff = async (d) => {
    const payload = compact({
      firstName: d.firstName, lastName: d.lastName, email: d.email, password: 'Temp1234!',
      phone: d.phone, role: d.role || 'staff',
      departmentId: resolveId(d.departmentId || d.department, departments),
      locationId: resolveId(d.assignedLocationId || d.locationId, locations),
      managerId: resolveId(d.managerId || d.manager, allUsersMap),
    })
    const r = await userService.create(payload); await loadAllData(); return r.data || r
  }

  const updateStaff = async (emailOrId, updates) => {
    const u = allUsersMap[emailOrId] || allUsersById[emailOrId]
    const p = { ...updates }
    if ('managerId' in p || 'manager' in p) { p.managerId = resolveId(p.managerId || p.manager, allUsersMap); delete p.manager }
    if ('departmentId' in p || 'department' in p) { p.departmentId = resolveId(p.departmentId || p.department, departments); delete p.department }
    if ('locationId' in p || 'assignedLocationId' in p) { p.locationId = resolveId(p.locationId || p.assignedLocationId, locations); delete p.assignedLocationId }
    await userService.update(u?.id || emailOrId, p); await loadAllData()
  }

  const setUserStatus = async (email, status, extraFields = {}) => {
    const u = allUsersMap[email]; if (!u) throw new Error('User not found')
    await userService.update(u.id, { status, ...extraFields }); await loadAllData(); return { success: true }
  }
  const deactivateUser = (email) => setUserStatus(email, 'suspended')
  const reactivateUser = (email) => setUserStatus(email, 'active', { isVerified: true })


  const crudWith = (svc) => ({
    create: async (d) => { const r = await svc.create(d); await loadAllData(); return r.data || r },
    update: async (id, d) => { await svc.update(id, d); await loadAllData(); return { success: true } },
    remove: async (id) => { await svc.remove(id); await loadAllData(); return { success: true } },
  })
  const deptCrud = crudWith(departmentService)
  const locCrud  = crudWith(locationService)


  const value = useMemo(() => ({
    user, login, logout,
    forgotPassword: (email) => authService.forgotPassword(email),
    resetPassword: (email, otp, password) => authService.resetPassword(email, otp, password),
    verifyOTP: (email, otp) => authService.verifyEmail(email, otp),
    resendOTP: (email) => authService.resendVerification(email),
    clockIn, clockOut, addLocation, removeLocation, isOnManager,
    leaveRequests, submitLeaveRequest, updateLeaveRequest, processLeaveRequest,
    rawLeaveRequests: leaveRequests, clockActivities, rawClockActivities: clockActivities,
    allUsers: allUsersMap, allUsersById, locations, departments,
    registerStaff, updateStaff, deactivateUser, reactivateUser,
    createDepartment: deptCrud.create, updateDepartment: deptCrud.update, deactivateDepartment: deptCrud.remove,
    createLocation: locCrud.create, updateLocation: locCrud.update, deactivateLocation: locCrud.remove,
    getStaffForSite: (locId) => user?.role !== 'security' ? [] : Object.values(allUsersById).filter(s => s.role === 'staff' && s.isActive && s.isClockedIn && (s.assignedLocationId == locId || s.locationId == locId)),
    saveFilterState: (pg, f) => setFilterStates(p => ({ ...p, [pg]: f })),
    getFilterState: (pg) => filterStates[pg] || {},
    getUserById: (id) => allUsersById[id] || null,
    getLocationById: (id) => locations[id] || null,
    activeOTPs: {}, LEAVE_TYPES, refreshData: loadAllData,
  }), [user, isOnManager, leaveRequests, clockActivities, allUsersMap, allUsersById, locations, departments, filterStates, loadAllData])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
