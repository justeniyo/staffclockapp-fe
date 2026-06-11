import { useState, useRef, useEffect } from 'react'
import { Navbar as BSNavbar, Container, Button } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import { isCEO } from '../../config/helpers'
import NotificationBell from './NotificationBell'

export default function AppNavbar({ onToggleMobile }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

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
          {user && <NotificationBell />}

          {user && (
            <div className="position-relative" ref={ref}>
              {/* Icon-only — the user's name, role and clock status live in the sidebar card */}
              <button
                type="button"
                className="navbar-user-tag navbar-user-icon"
                onClick={() => setOpen(!open)}
                aria-label="Account menu"
              >
                <i className={`fas ${isCEO(user) ? 'fa-crown' : user.isManager ? 'fa-user-tie' : 'fa-user'}`}></i>
                <i className={`fas fa-chevron-${open ? 'up' : 'down'} ms-1`}></i>
              </button>
              {open && (
                <div className="user-dropdown">
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
