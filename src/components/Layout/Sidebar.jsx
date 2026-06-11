import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isCEO, canAccessManagerPortal } from '../../config/helpers'

const link = ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`
const S = ({ to, icon, children, badge }) => (
  <NavLink to={to} className={link}>
    <i className={`fas ${icon} me-2`}></i>{children}
    {badge > 0 && <span className="badge bg-warning text-dark ms-2">{badge}</span>}
  </NavLink>
)
const Section = ({ title }) => <div className="text-uppercase small text-secondary mt-3 mb-1 fw-bold" style={{ letterSpacing: '.06em', fontSize: '.72rem' }}>{title}</div>

// Tag styling by active role.
const ROLE_TAG = {
  ceo:      { label: 'CEO',      cls: 'role-tag-ceo' },
  admin:    { label: 'Admin',    cls: 'role-tag-admin' },
  manager:  { label: 'Manager',  cls: 'role-tag-manager' },
  security: { label: 'Security', cls: 'role-tag-security' },
  staff:    { label: 'Staff',    cls: 'role-tag-staff' },
}

// Decide which role is currently "active" based on the page the user is on.
// This means the badge in the sidebar card reflects the portal they're in
// right now, not every role they could potentially use.
const detectActiveRole = (path, user) => {
  if (path.startsWith('/ceo'))      return 'ceo'
  if (path.startsWith('/manager'))  return 'manager'
  if (path.startsWith('/admin'))    return 'admin'
  if (path.startsWith('/security')) return 'security'
  // Staff areas (/clock, /staff/*, /staff-dashboard) — show their primary role
  if (isCEO(user))    return 'ceo'
  if (user?.role === 'admin')    return 'admin'
  if (user?.role === 'security') return 'security'
  return 'staff'
}

export default function Sidebar({ variant = 'staff' }) {
  const { user, leaveRequests } = useAuth()
  const location = useLocation()

  const pendingCount = (variant === 'manager' || user?.role === 'admin')
    ? leaveRequests.filter(r => r.status === 'pending').length
    : 0

  const activeRole = detectActiveRole(location.pathname, user)
  const tag = ROLE_TAG[activeRole] || ROLE_TAG.staff

  const dept = user?.department || user?.departmentObj?.name || ''
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''

  // Available portal switches — show ones the user has access to *and* isn't currently in.
  const availablePortals = []
  if (user) {
    if (isCEO(user) && activeRole !== 'ceo')                       availablePortals.push({ to: '/ceo-dashboard',     icon: 'fa-crown',     label: 'CEO Portal' })
    if ((canAccessManagerPortal(user) || isCEO(user)) && activeRole !== 'manager')
                                                                   availablePortals.push({ to: '/manager-dashboard', icon: 'fa-users-cog', label: 'Manager Portal' })
    if ((user.role === 'staff' || isCEO(user)) && activeRole !== 'staff')
                                                                   availablePortals.push({ to: '/staff-dashboard',   icon: 'fa-user',      label: 'Staff Portal' })
  }

  // Clock pill — only meaningful for roles that actually clock in (staff, CEO).
  const showClockStatus = user && (user.role === 'staff' || isCEO(user))
  const clockedIn = !!user?.isClockedIn

  return (
    <div className="d-flex flex-column h-100">
      {/* User card — name, department, single active-role tag, clock status */}
      {user && (
        <div className="sidebar-user-card mb-3">
          <div className="sidebar-user-name">{fullName || 'Unknown User'}</div>
          {dept && <div className="sidebar-user-dept">{dept}</div>}
          <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
            <span className={`role-tag ${tag.cls}`}>{tag.label}</span>
            {showClockStatus && (
              <span className={`clock-pill ${clockedIn ? 'is-in' : 'is-out'}`}>
                <span className="clock-dot"></span>
                {clockedIn ? 'Clocked in' : 'Clocked out'}
              </span>
            )}
          </div>
        </div>
      )}

      <Section title="Navigation" />

      {variant === 'manager' && <>
        <S to="/manager-dashboard" icon="fa-tachometer-alt">Dashboard</S>
        <S to="/manager/leave-requests" icon="fa-calendar-check" badge={pendingCount}>Leave Requests</S>
      </>}

      {variant !== 'manager' && user?.role === 'staff' && <>
        <S to="/staff-dashboard" icon="fa-tachometer-alt">Dashboard</S>
        <S to="/clock" icon="fa-clock">Clock In/Out</S>
        <S to="/staff/request-leave" icon="fa-calendar-plus">Request Leave</S>
      </>}

      {user?.role === 'admin' && <>
        <S to="/admin-dashboard" icon="fa-tachometer-alt">Dashboard</S>
        <S to="/admin/register-staff" icon="fa-user-plus">Register Staff</S>
        <S to="/admin/manage-staff" icon="fa-users-cog">Manage Staff</S>
        <S to="/admin/clock-activities" icon="fa-clock">Clock Activities</S>
        <S to="/admin/leave-requests" icon="fa-calendar-check" badge={pendingCount}>Leave Requests</S>
        <Section title="Reports" />
        <S to="/admin/reports" icon="fa-chart-bar">Export Reports</S>
      </>}

      {user?.role === 'security' && <S to="/security-dashboard" icon="fa-tachometer-alt">Dashboard</S>}

      {/* Portal switches — only shown to users who have more than one role available */}
      {availablePortals.length > 0 && <>
        <Section title="Switch Portal" />
        {availablePortals.map(p => (
          <S key={p.to} to={p.to} icon={p.icon}>{p.label}</S>
        ))}
      </>}
    </div>
  )
}
