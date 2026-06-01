import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Step 1: ask for email, send the reset OTP, then redirect to /reset-password.
export default function ForgotPassword() {
  const [searchParams] = useSearchParams()
  const { forgotPassword } = useAuth()
  const navigate = useNavigate()
  const portal = searchParams.get('portal') || 'staff'

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await forgotPassword(email)
      // Move to the reset page with email prefilled. Backend gives no signal
      // whether the email actually exists (anti-enumeration) so we always advance.
      navigate(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`login-page login-${portal}`}>
      <div className="card login-card">
        <div className="card-header"><div className="login-logo">StaffClock</div></div>
        <div className="card-body">
          <div className="login-title"><i className="fas fa-key me-2"></i>Reset Password</div>

          <form onSubmit={handleSubmit}>
            <p className="text-muted small">
              Enter your email and we'll send you a 6-digit code to reset your password.
            </p>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={email} required
                onChange={e => setEmail(e.target.value)} disabled={loading} />
            </div>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <button className="btn btn-warning w-100 mb-3" type="submit" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin me-2"></i>Sending…</> : 'Send Reset Code'}
            </button>
          </form>

          <div className="text-center">
            <Link to={portal === 'staff' ? '/' : `/${portal}`} className="text-decoration-none">
              <i className="fas fa-arrow-left me-2"></i>Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
