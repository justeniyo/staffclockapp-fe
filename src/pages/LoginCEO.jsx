import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isCEO } from '../config/seedUsers'

export default function LoginCEO() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      if (isCEO(user)) navigate('/ceo-dashboard', { replace: true })
      else if (user.role === 'staff') navigate('/clock', { replace: true })
      else if (user.role === 'admin') navigate('/admin-dashboard', { replace: true })
      else if (user.role === 'security') navigate('/security-dashboard', { replace: true })
    }
  }, [user, navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try { await login({ email, password, roleHint: 'ceo' }) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="login-page login-ceo">
      <div className="card login-card">
        <div className="card-header"><div className="login-logo">StaffClock</div></div>
        <div className="card-body">
          <div className="login-title"><i className="fas fa-crown me-2"></i>CEO Portal</div>
          <div className="alert alert-info mb-4">
            <div className="small">
              <strong>CEO Access:</strong> Executive Dashboard, Staff Portal, Manager Portal.
            </div>
          </div>
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
            </div>
            {error && <div className="alert alert-warning py-2"><i className="fas fa-exclamation-triangle me-2"></i>{error}</div>}
            <button className="btn btn-warning w-100" type="submit" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin me-2"></i>Signing in...</> : <><i className="fas fa-sign-in-alt me-2"></i>Sign In as CEO</>}
            </button>
          </form>
          <div className="text-center mt-3">
            <Link to="/forgot-password?portal=ceo" className="text-decoration-none"><i className="fas fa-key me-1"></i>Forgot your password?</Link>
          </div>
          <div className="text-center mt-3">
            <small className="text-muted">
              Other portals: <Link to="/staff" className="text-decoration-none ms-1">Staff</Link> | <Link to="/admin" className="text-decoration-none ms-1">Admin</Link> | <Link to="/security" className="text-decoration-none ms-1">Security</Link>
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}
