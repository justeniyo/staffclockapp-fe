import { useState, useRef, useEffect } from 'react'
import { Navbar as BSNavbar, Container, Button } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserInitials, isCEO, canAccessManagerPortal } from '../../config/helpers'

const PORTALS = [
  { key: 'ceo',     icon: 'fa-crown',     label: 'CEO Portal',     path: '/ceo-dashboard',     check: (u) => isCEO(u) },
  { key: 'manager', icon: 'fa-users-cog',  label: 'Manager Portal', path: '/manager-dashboard', check: (u) => canAccessManagerPortal(u) || isCEO(u) },
  { key: 'staff',   icon: 'fa-user',       label: 'Staff Portal',   path: '/staff-dashboard',   check: (u) => u.role === 'staff' || isCEO(u) },
]

const detectPortal = (path) => {
  if (path.startsWith('/ceo')) return 'ceo'
  if (path.startsWith('/manager')) return 'manager'
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/security')) return 'security'
  return 'staff'
}

export default function AppNavbar({ onToggleMobile }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = detectPortal(location.pathname)
  const available = PORTALS.filter(p => user && p.check(user) && p.key !== current)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <BSNavbar bg="warning" className="px-3 py-1">
      <Container fluid className="p-0 d-flex align-items-center justify-content-between gap-2">
        <BSNavbar.Brand href="/" className="brand-big">StaffClock</BSNavbar.Brand>

        <div className="d-flex align-items-center gap-2 ms-auto">
          {user && (
            <div className="position-relative" ref={ref}>
              <div className="navbar-user-tag" onClick={() => setOpen(!open)}>
                <i className={`fas ${isCEO(user) ? 'fa-crown' : user.isManager ? 'fa-user-tie' : 'fa-user'}`}></i>
                <span className="d-none d-lg-inline fw-semibold">{getFullName(user)}</span>
                <span className="d-lg-none fw-bold">{getUserInitials(user)}</span>
                <i className={`fas fa-chevron-${open ? 'up' : 'down'} ms-1`}></i>
              </div>
              {open && (
                <div className="user-dropdown">
                  {available.map(p => (
                    <button key={p.key} className="user-dropdown-item" onClick={() => { navigate(p.path); setOpen(false) }}>
                      <i className={`fas ${p.icon}`}></i>{p.label}
                    </button>
                  ))}
                  {available.length > 0 && <hr className="my-0" />}
                  <button className="user-dropdown-item" onClick={() => { setOpen(false); logout() }}>
                    <i className="fas fa-sign-out-alt"></i>Logout
                  </button>
                </div>
              )}
            </div>
          )}

          <Button className="d-lg-none" variant="outline-dark" onClick={onToggleMobile} aria-label="Menu">☰</Button>
        </div>
      </Container>
    </BSNavbar>
  )
}
