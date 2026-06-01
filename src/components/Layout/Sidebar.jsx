import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isCEO } from '../../config/helpers'

const link = ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`
const S = ({ to, icon, children, badge }) => (
  <NavLink to={to} className={link}>
    <i className={`fas ${icon} me-2`}></i>{children}
    {badge > 0 && <span className="badge bg-warning text-dark ms-2">{badge}</span>}
  </NavLink>
)
const Section = ({ title }) => <div className="text-uppercase small text-secondary mt-3 mb-1 fw-bold" style={{ letterSpacing: '.06em', fontSize: '.72rem' }}>{title}</div>

export default function Sidebar({ variant = 'staff' }) {
  const { user, leaveRequests } = useAuth()
  const pendingCount = variant === 'manager' ? leaveRequests.filter(r => r.status === 'pending').length : 0

  const ROLE_LABEL = { manager: isCEO(user) ? 'CEO • Manager' : 'Manager', staff: 'Staff', admin: 'Admin', security: 'Security', ceo: 'CEO' }

  return (
    <div className="d-flex flex-column h-100">
      <div className="fw-bold text-uppercase text-white mb-3" style={{ fontSize: '1.05rem', letterSpacing: '.05em' }}>
        {ROLE_LABEL[variant] || 'Menu'}
      </div>

      <Section title="Navigation" />

      {variant === 'manager' && <>
        <S to="/manager-dashboard" icon="fa-tachometer-alt">Dashboard</S>
        <S to="/manager/leave-requests" icon="fa-calendar-check" badge={pendingCount}>Leave Requests</S>
      </>}

      {variant !== 'manager' && user?.role === 'staff' && <>
        <S to="/staff-dashboard" icon="fa-tachometer-alt">Dashboard</S>
        <S to="/clock" icon="fa-clock">Clock In/Out</S>
        <S to="/staff/request-leave" icon="fa-calendar-plus">Request Leave</S>
        {user.isManager && <><Section title="Manager" /><S to="/manager-dashboard" icon="fa-users-cog">Manager Portal</S></>}
      </>}

      {user?.role === 'admin' && <>
        <S to="/admin-dashboard" icon="fa-tachometer-alt">Dashboard</S>
        <S to="/admin/register-staff" icon="fa-user-plus">Register Staff</S>
        <S to="/admin/manage-staff" icon="fa-users-cog">Manage Staff</S>
        <S to="/admin/clock-activities" icon="fa-clock">Clock Activities</S>
        <Section title="Reports" />
        <S to="/admin/reports" icon="fa-chart-bar">Export Reports</S>
      </>}

      {user?.role === 'security' && <S to="/security-dashboard" icon="fa-tachometer-alt">Dashboard</S>}

      {isCEO(user) && variant !== 'manager' && <>
        <Section title="Portal Access" />
        <S to="/ceo-dashboard" icon="fa-crown">CEO Dashboard</S>
        {user.isManager && <S to="/manager-dashboard" icon="fa-users-cog">Manager Portal</S>}
        <S to="/staff-dashboard" icon="fa-user">Staff Portal</S>
      </>}
    </div>
  )
}
