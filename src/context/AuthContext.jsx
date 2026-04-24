import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService, attendanceService, leaveService, userService, departmentService, locationService } from '../services'
import { getToken, setToken, clearAuth } from '../services/api.js'

/*
 * Helpers carried over from the seed-data version so existing pages keep
 * working without changes.
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

export const isCEO = (u) => u?.role === 'ceo' || u?.subRole === 'ceo' || u?.accessLevel === 'ceo'
export const canAccessManagerPortal = (u) => u?.isManager && u?.role === 'staff'

const LEAVE_TYPES = ['Annual', 'Sick', 'Emergency']

/* ─── context ─── */
const AuthContext = createContext()

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  /* ── core auth state ── */
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sc_user')
    return saved ? JSON.parse(saved) : null
  })

  /* ── reference data (loaded after login) ── */
  const [allUsersMap, setAllUsersMap] = useState({})       // keyed by email
  const [allUsersById, setAllUsersById] = useState({})     // keyed by id
  const [departments, setDepartments] = useState({})       // keyed by id
  const [locations, setLocations] = useState({})           // keyed by id

  /* ── transactional data ── */
  const [leaveRequests, setLeaveRequests] = useState([])
  const [clockActivities, setClockActivities] = useState([])

  /* ── ui helpers ── */
  const [loading, setLoading] = useState(false)
  const [filterStates, setFilterStates] = useState(() => {
    const saved = localStorage.getItem('sc_filter_states')
    return saved ? JSON.parse(saved) : {}
  })

  /* ── persist user to localStorage ── */
  useEffect(() => {
    if (user) localStorage.setItem('sc_user', JSON.stringify(user))
    else localStorage.removeItem('sc_user')
  }, [user])

  useEffect(() => {
    localStorage.setItem('sc_filter_states', JSON.stringify(filterStates))
  }, [filterStates])

  /* ── load reference data when user is present ── */
  const loadReferenceData = useCallback(async () => {
    try {
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

      // Load users only for admin/ceo roles
      if (user?.role === 'admin' || isCEO(user)) {
        const usersRes = await userService.getAll({ limit: 200 }).catch(() => ({ data: [] }))
        const byEmail = {}
        const byId = {}
        ;(usersRes.data || []).forEach(u => {
          byEmail[u.email] = u
          byId[u.id] = u
        })
        setAllUsersMap(byEmail)
        setAllUsersById(byId)
      }
    } catch (err) {
      console.error('Failed to load reference data:', err)
    }
  }, [user?.role])

  useEffect(() => {
    if (user && getToken()) {
      loadReferenceData()
    }
  }, [user, loadReferenceData])

  /* ── bootstrap: verify existing token on mount ── */
  useEffect(() => {
    if (getToken() && user) {
      authService.verifyToken().catch(() => {
        clearAuth()
        setUser(null)
      })
    }
  }, [])

  /* ── filter state helpers ── */
  const saveFilterState = (page, filters) => {
    setFilterStates(prev => ({ ...prev, [page]: filters }))
  }
  const getFilterState = (page) => filterStates[page] || {}

  /* ── helper to get user by ID from cache ── */
  const getUserById = useCallback((id) => {
    return allUsersById[id] || null
  }, [allUsersById])

  /* ── helper to get location by ID from cache ── */
  const getLocationById = useCallback((id) => {
    return locations[id] || null
  }, [locations])

  /* ═══════════════════════════════════════════════
     AUTH OPERATIONS
     ═══════════════════════════════════════════════ */

  const login = async ({ email, password, roleHint }) => {
    const res = await authService.login(email, password)
    const profile = res.data?.user || res.data || res.user

    if (!profile) throw new Error('Invalid response from server')

    // Role validation (mirrors original logic)
    if (roleHint === 'ceo' && !isCEO(profile)) throw new Error('Wrong portal for this user')
    if (roleHint === 'staff' && profile.role !== 'staff') throw new Error('Wrong portal for this user')
    if (roleHint && !['ceo', 'staff'].includes(roleHint) && roleHint !== profile.role) throw new Error('Wrong portal for this user')

    setUser({ ...profile, email })

    // Redirect based on role
    if (isCEO(profile)) navigate('/ceo-dashboard', { replace: true })
    else if (profile.role === 'staff') navigate('/clock', { replace: true })
    else if (profile.role === 'admin') navigate('/admin-dashboard', { replace: true })
    else if (profile.role === 'security') navigate('/security-dashboard', { replace: true })
  }

  const logout = async () => {
    try { await authService.logout() } catch { /* swallow */ }
    setUser(null)
    setAllUsersMap({})
    setAllUsersById({})
    navigate('/staff', { replace: true })
  }

  const forgotPassword = async (email) => {
    return authService.forgotPassword(email)
  }

  const resetPassword = async (email, token, newPassword) => {
    return authService.resetPassword(token, newPassword)
  }

  const verifyOTP = async (email, otp) => {
    // backend uses token-based verification, map OTP → token
    return authService.verifyEmail(otp)
  }

  const resendOTP = async (email, type = 'verification') => {
    return authService.resendVerification(email)
  }

  /* ═══════════════════════════════════════════════
     CLOCK OPERATIONS
     ═══════════════════════════════════════════════ */

  const clockIn = async (locationId) => {
    const res = await attendanceService.clockIn(locationId)
    // Update local user state
    setUser(prev => prev ? { ...prev, isClockedIn: true, currentLocationIds: [locationId] } : prev)
    return res
  }

  const clockOut = async () => {
    const res = await attendanceService.clockOut()
    setUser(prev => prev ? { ...prev, isClockedIn: false, currentLocationIds: [] } : prev)
    return res
  }

  const addLocation = async (locationId) => {
    // Backend doesn't have a separate "add location" endpoint — simulate with clock-out + clock-in
    // or treat as a location change
    await attendanceService.clockOut()
    const res = await attendanceService.clockIn(locationId)
    setUser(prev => prev ? { ...prev, currentLocationIds: [locationId] } : prev)
    return { success: true, location: locations[locationId]?.name }
  }

  const removeLocation = async (locationId) => {
    return clockOut()
  }

  /* ═══════════════════════════════════════════════
     LEAVE OPERATIONS
     ═══════════════════════════════════════════════ */

  const submitLeaveRequest = async (requestData) => {
    const res = await leaveService.create({
      type: requestData.type?.toLowerCase() || requestData.type,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      reason: requestData.reason,
    })
    return res.data || res
  }

  const updateLeaveRequest = async (requestId, updatedData) => {
    // Backend doesn't have a PUT on leaves — cancel and re-create
    await leaveService.cancel(requestId)
    return submitLeaveRequest(updatedData)
  }

  const processLeaveRequest = async (requestId, status, notes) => {
    if (status === 'approved') {
      return leaveService.approve(requestId, notes)
    } else if (status === 'rejected') {
      return leaveService.reject(requestId, notes)
    }
  }

  /* ═══════════════════════════════════════════════
     USER MANAGEMENT (admin)
     ═══════════════════════════════════════════════ */

  const registerStaff = async (staffData) => {
    const res = await userService.create({
      firstName: staffData.firstName,
      lastName: staffData.lastName,
      email: staffData.email,
      password: 'Temp1234!',          // default temp password
      phone: staffData.phone,
      role: staffData.role || 'staff',
      departmentId: staffData.departmentId || staffData.department,
      locationId: staffData.assignedLocationId,
      managerId: staffData.managerId,
    })
    await loadReferenceData()         // refresh users list
    return res.data || res
  }

  const updateStaff = async (emailOrId, updates) => {
    const u = allUsersMap[emailOrId] || allUsersById[emailOrId]
    const id = u?.id || emailOrId
    await userService.update(id, updates)
    await loadReferenceData()
  }

  const deactivateUser = async (email, reason, replacementCeoEmail) => {
    const u = allUsersMap[email]
    if (!u) throw new Error('User not found')
    await userService.update(u.id, { status: 'suspended' })
    await loadReferenceData()
    return { success: true }
  }

  const reactivateUser = async (email) => {
    const u = allUsersMap[email]
    if (!u) throw new Error('User not found')
    await userService.update(u.id, { status: 'active' })
    await loadReferenceData()
    return { success: true }
  }

  /* ═══════════════════════════════════════════════
     DEPARTMENT / LOCATION MANAGEMENT
     ═══════════════════════════════════════════════ */

  const createDepartment = async (data) => {
    const res = await departmentService.create(data)
    await loadReferenceData()
    return res.data || res
  }

  const updateDepartment = async (id, data) => {
    await departmentService.update(id, data)
    await loadReferenceData()
    return { success: true }
  }

  const deactivateDepartment = async (id) => {
    await departmentService.remove(id)
    await loadReferenceData()
    return { success: true }
  }

  const createLocation = async (data) => {
    const res = await locationService.create(data)
    await loadReferenceData()
    return res.data || res
  }

  const updateLocation = async (id, data) => {
    await locationService.update(id, data)
    await loadReferenceData()
    return { success: true }
  }

  const deactivateLocation = async (id) => {
    await locationService.remove(id)
    await loadReferenceData()
    return { success: true }
  }

  /* ═══════════════════════════════════════════════
     SECURITY – site-specific helpers
     ═══════════════════════════════════════════════ */

  const getStaffForSite = (locationId) => {
    if (user?.role !== 'security') return []
    return Object.values(allUsersById).filter(s =>
      s.role === 'staff' && s.isActive && s.isClockedIn && s.locationId === locationId
    )
  }

  /* ═══════════════════════════════════════════════
     COMPUTED / DERIVED VALUES
     ═══════════════════════════════════════════════ */

  const isOnManager = location.pathname.startsWith('/manager')

  // Provide allUsers as email-keyed object for backward compat
  const allUsers = allUsersMap

  /* ── context value ── */
  const value = useMemo(() => ({
    // Auth state
    user,
    login,
    logout,
    forgotPassword,
    resetPassword,
    resendOTP,
    verifyOTP,

    // Clock
    clockIn,
    clockOut,
    addLocation,
    removeLocation,

    // Portal awareness
    isOnManager,

    // Leave
    leaveRequests,
    submitLeaveRequest,
    updateLeaveRequest,
    processLeaveRequest,
    rawLeaveRequests: leaveRequests,

    // Clock activities
    clockActivities,
    rawClockActivities: clockActivities,

    // Reference data
    allUsers,
    locations,
    departments,

    // User / Staff management
    registerStaff,
    updateStaff,
    deactivateUser,
    reactivateUser,

    // Department / Location
    createDepartment,
    updateDepartment,
    deactivateDepartment,
    createLocation,
    updateLocation,
    deactivateLocation,

    // Security
    getStaffForSite,

    // Filter helpers
    filterStates,
    saveFilterState,
    getFilterState,

    // OTP (kept for legacy pages)
    activeOTPs: {},

    // Constants
    LEAVE_TYPES,

    // Helpers exposed for components
    getUserById,
    getLocationById,

    // Refresh helper
    refreshData: loadReferenceData,
  }), [
    user, isOnManager, leaveRequests, clockActivities,
    allUsers, locations, departments, filterStates,
    getUserById, getLocationById, loadReferenceData,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
