import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isCEO } from '../config/seedUsers'

const PORTALS = {
  staff:    { title: 'Sign In',             cssClass: 'login-staff',    icon: null },
  admin:    { title: 'Sign In as Admin',     cssClass: 'login-admin',    icon: null },
  security: { title: 'Sign In',             cssClass: 'login-security', icon: null },
  ceo:      { title: 'CEO Portal',           cssClass: 'login-ceo',      icon: 'fa-crown' },
}

const ALL_ROLES = Object.keys(PORTALS)

const LANDING = (user) => {
  if (isCEO(user)) return '/ceo-dashboard'
  if (user.role === 'admin') return '/admin-dashboard'
  if (user.role === 'security') return '/security-dashboard'
  return '/clock'
}

export default function LoginPage({ role = 'staff' }) {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const portal = PORTALS[role]

  useEffect(() => {
    if (user) navigate(LANDING(user), { replace: true })
  }, [user, navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try { await login({ email, password, roleHint: role }) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const otherPortals = ALL_ROLES.filter(r => r !== role)

  return (
    <div className={`login-page ${portal.cssClass}`}>
      <div className="card login-card">
        <div className="card-header"><div className="login-logo">StaffClock</div></div>
        <div className="card-body">
          <div className="login-title">
            {portal.icon && <i className={`fas ${portal.icon} me-2`}></i>}
            {portal.title}
          </div>

          {role === 'ceo' && (
            <div className="alert alert-info mb-4">
              <small><strong>CEO Access:</strong> Executive Dashboard, Staff Portal, Manager Portal.</small>
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
            </div>
            {error && (
              <div className="alert alert-warning py-2"><i className="fas fa-exclamation-triangle me-2"></i>{error}</div>
            )}
            <button className="btn btn-warning w-100" type="submit" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin me-2"></i>Signing in...</>
                       : role === 'ceo' ? <><i className="fas fa-sign-in-alt me-2"></i>Sign In as CEO</> : 'Login'}
            </button>
          </form>

          <div className="text-center mt-3">
            <Link to={`/forgot-password?portal=${role}`} className="text-decoration-none">
              {role === 'ceo' && <i className="fas fa-key me-1"></i>}Forgot your password?
            </Link>
          </div>

          {/* {otherPortals.length > 0 && (
            <div className="text-center mt-2">
              <small className="text-muted">
                Other portals:{' '}
                {otherPortals.map((r, i) => (
                  <span key={r}>
                    {i > 0 && ' | '}
                    <Link to={r === 'staff' ? '/' : `/${r}`} className="text-decoration-none ms-1">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Link>
                  </span>
                ))}
              </small>
            </div>
          )} */}
        </div>
      </div>
    </div>
  )
}
