import { useState } from 'react'
import { Offcanvas } from 'react-bootstrap'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'

export default function Layout({ children, variant }) {
  const [show, setShow] = useState(false)
  const { user, isOnManager } = useAuth()
  const v = variant || (isOnManager ? 'manager' : 'staff')
  const ROLES = { manager: 'Manager', staff: 'Staff', admin: 'Admin', security: 'Security', ceo: 'Executive' }

  return (
    <div className="app-shell">
      <nav className="navbar-fixed"><Navbar onToggleMobile={() => setShow(true)} /></nav>
      <div className="main-container">
        <aside className="sidebar-fixed"><Sidebar variant={v} /></aside>
        <section className="main-col">
          <Offcanvas placement="end" show={show} onHide={() => setShow(false)} className="bg-dark text-white">
            <Offcanvas.Header closeButton closeVariant="white">
              <div className="fw-bold text-uppercase">{ROLES[v] || 'Menu'}</div>
            </Offcanvas.Header>
            <Offcanvas.Body><Sidebar variant={v} /></Offcanvas.Body>
          </Offcanvas>
          <div className="content-scroll">{children}</div>
        </section>
      </div>
    </div>
  )
}
