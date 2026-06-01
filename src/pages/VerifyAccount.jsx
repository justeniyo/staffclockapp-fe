import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Email-OTP verification: user enters their email + 6-digit code.
// Email may be prefilled from ?email= (e.g. when redirected after signup).
export default function VerifyAccount() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyOTP, resendOTP } = useAuth()

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [info, setInfo] = useState('')

  // Show a brief hint if the user landed here right after signing up.
  useEffect(() => {
    if (searchParams.get('email')) {
      setInfo(`We sent a verification code to ${searchParams.get('email')}. Check your inbox.`)
    }
  }, [searchParams])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setInfo('')
    if (!/^\d{6}$/.test(otp)) return setError('Please enter the 6-digit code from your email.')

    setLoading(true)
    try {
      await verifyOTP(email, otp)
      setSuccess('Your account is verified and active. Redirecting to login…')
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
      await resendOTP(email)
      setInfo('If an unverified account exists for that email, a new code has been sent.')
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
          <div className="login-title"><i className="fas fa-envelope-circle-check me-2"></i>Verify Your Account</div>

          {info && <div className="alert alert-info py-2">{info}</div>}

          <form onSubmit={handleVerify}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={email} required
                onChange={e => setEmail(e.target.value)} disabled={loading || !!success} />
            </div>

            <div className="mb-3">
              <label className="form-label">6-Digit Verification Code</label>
              <input className="form-control text-center" type="text" inputMode="numeric"
                autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading || !!success}
                style={{ fontSize: '1.5rem', letterSpacing: '.4em', fontFamily: 'monospace' }}
                placeholder="••••••" />
              <small className="text-muted">Check your email for the code we sent you.</small>
            </div>

            {error && <div className="alert alert-danger py-2">{error}</div>}
            {success && <div className="alert alert-success py-2">{success}</div>}

            <button className="btn btn-warning w-100 mb-3" type="submit"
              disabled={loading || !!success || otp.length !== 6}>
              {loading ? <><i className="fas fa-spinner fa-spin me-2"></i>Verifying…</> : 'Verify & Activate Account'}
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
