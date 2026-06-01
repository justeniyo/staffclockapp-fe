import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyAccount() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyOTP, resendOTP } = useAuth()

  const emailParam = searchParams.get('email') || ''
  const tokenParam = searchParams.get('token') || '' // set when arriving from email link

  const [email, setEmail] = useState(emailParam)
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  // Auto-verify if a token arrives from the email link
  useEffect(() => {
    if (!tokenParam) return
    setStatus('loading')
    setMessage('Verifying your account…')

    // The token from the email link is passed directly to verifyOTP (which calls
    // authService.verifyEmail(token) → GET /api/auth/verify-email?token=...)
    verifyOTP('', tokenParam)
      .then(() => {
        setStatus('success')
        setMessage('Your account has been verified! Redirecting to login…')
        setTimeout(() => navigate('/staff'), 2500)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Verification failed. The link may have expired.')
      })
  }, [tokenParam]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualVerify = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await verifyOTP(email, otp)
      setStatus('success')
      setMessage('Account verified! Redirecting…')
      setTimeout(() => navigate(`/reset-password?email=${email}&verified=true`), 2000)
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  const handleResend = async () => {
    if (!email) return setMessage('Enter your email first.')
    try {
      await resendOTP(email, 'verification')
      setMessage('New code sent!')
    } catch (err) {
      setMessage(err.message)
    }
  }

  // ── Auto-verify view (arrived via email link) ──
  if (tokenParam) {
    return (
      <div className="login-page login-staff">
        <div className="card login-card">
          <div className="card-header"><div className="login-logo">StaffClock</div></div>
          <div className="card-body text-center py-5">
            {status === 'loading' && <>
              <div className="spinner-border text-warning mb-3"></div>
              <p className="text-muted">Verifying your account…</p>
            </>}
            {status === 'success' && <>
              <i className="fas fa-check-circle fa-4x text-success mb-3"></i>
              <h5 className="text-success">Account Verified!</h5>
              <p className="text-muted">{message}</p>
            </>}
            {status === 'error' && <>
              <i className="fas fa-times-circle fa-4x text-danger mb-3"></i>
              <h5 className="text-danger">Verification Failed</h5>
              <p className="text-muted">{message}</p>
              <p className="text-muted small">The link may have expired. Request a new one below.</p>
              <div className="mt-3">
                <input className="form-control mb-2" type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
                <button className="btn btn-warning w-100" onClick={handleResend}>Resend Verification Email</button>
              </div>
              <Link to="/" className="d-block mt-3 text-decoration-none"><i className="fas fa-arrow-left me-2"></i>Back to Login</Link>
            </>}
          </div>
        </div>
      </div>
    )
  }

  // ── Manual OTP entry view ──
  return (
    <div className="login-page login-staff">
      <div className="card login-card">
        <div className="card-header"><div className="login-logo">StaffClock</div></div>
        <div className="card-body">
          <div className="login-title"><i className="fas fa-user-check me-2"></i>Verify Your Account</div>
          <div className="alert alert-info">Enter the 6-digit code sent to your email, then set a new password.</div>
          <form onSubmit={handleManualVerify}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={status === 'loading'} />
            </div>
            <div className="mb-3">
              <label className="form-label">Verification Code</label>
              <div className="input-group">
                <input className="form-control text-center" type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} required disabled={status === 'loading'} />
                <button type="button" className="btn btn-outline-warning" onClick={handleResend} title="Resend code">
                  <i className="fas fa-redo"></i>
                </button>
              </div>
            </div>
            {status === 'error'   && <div className="alert alert-danger py-2"><i className="fas fa-exclamation-triangle me-2"></i>{message}</div>}
            {status === 'success' && <div className="alert alert-success py-2"><i className="fas fa-check me-2"></i>{message}</div>}
            <button className="btn btn-warning w-100" type="submit" disabled={status === 'loading' || !otp.trim()}>
              {status === 'loading' ? <><i className="fas fa-spinner fa-spin me-2"></i>Verifying…</> : 'Verify Account'}
            </button>
          </form>
          <div className="text-center mt-3"><Link to="/" className="text-decoration-none"><i className="fas fa-arrow-left me-2"></i>Back to Login</Link></div>
        </div>
      </div>
    </div>
  )
}
