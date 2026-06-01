import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Step 2 of password reset: user pastes the 6-digit OTP from email and sets a new password.
export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { resetPassword, forgotPassword } = useAuth()

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [info, setInfo] = useState('')

  const validatePassword = () => {
    if (password !== confirm) return 'Passwords do not match.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.'
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.'
    if (!/\d/.test(password)) return 'Password must contain a number.'
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) return 'Password must contain a special character.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setInfo('')
    if (!/^\d{6}$/.test(otp)) return setError('Please enter the 6-digit code from your email.')
    const v = validatePassword()
    if (v) return setError(v)

    setLoading(true)
    try {
      await resetPassword(email, otp, password)
      setSuccess('Password updated! Redirecting to login…')
      setTimeout(() => navigate('/'), 1800)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError(''); setSuccess(''); setInfo('')
    if (!email) return setError('Please enter your email first.')
    setResending(true)
    try {
      await forgotPassword(email)
      setInfo('If an account exists for that email, a new reset code has been sent.')
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="login-page login-staff">
      <div className="card login-card">
        <div className="card-header"><div className="login-logo">StaffClock</div></div>
        <div className="card-body">
          <div className="login-title"><i className="fas fa-shield-alt me-2"></i>Set New Password</div>

          {info && <div className="alert alert-info py-2">{info}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={email} required
                onChange={e => setEmail(e.target.value)} disabled={loading || !!success} />
            </div>

            <div className="mb-3">
              <label className="form-label">6-Digit Reset Code</label>
              <input className="form-control text-center" type="text" inputMode="numeric"
                autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading || !!success}
                style={{ fontSize: '1.5rem', letterSpacing: '.4em', fontFamily: 'monospace' }}
                placeholder="••••••" />
              <small className="text-muted">Check your email for the code we sent you.</small>
            </div>

            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input className="form-control" type="password" value={password} required
                onChange={e => setPassword(e.target.value)} disabled={loading || !!success} />
              <small className="text-muted">At least 8 characters, with upper, lower, number, and symbol.</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" type="password" value={confirm} required
                onChange={e => setConfirm(e.target.value)} disabled={loading || !!success} />
            </div>

            {error && <div className="alert alert-danger py-2">{error}</div>}
            {success && <div className="alert alert-success py-2">{success}</div>}

            <button className="btn btn-warning w-100 mb-3" type="submit"
              disabled={loading || !!success}>
              {loading ? <><i className="fas fa-spinner fa-spin me-2"></i>Updating…</> : 'Update Password'}
            </button>
          </form>

          <div className="text-center">
            <button type="button" className="btn btn-link p-0 text-decoration-none me-3"
              onClick={handleResend} disabled={resending || !!success}>
              <i className="fas fa-paper-plane me-1"></i>
              {resending ? 'Sending…' : "Didn't receive a code? Resend"}
            </button>
            <Link to="/" className="text-decoration-none">
              <i className="fas fa-arrow-left me-1"></i>Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
