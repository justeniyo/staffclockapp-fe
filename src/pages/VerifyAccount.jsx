import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Account verification page.
 *
 * Single-action flow: when arriving from the email link with ?token=XXX,
 * the page auto-calls the backend which marks the user as verified + active
 * in one go. No password reset step, no extra form — just a "Go to Login"
 * button when done.
 */
export default function VerifyAccount() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyOTP, resendOTP } = useAuth()

  const tokenParam = searchParams.get('token') || ''

  const [status, setStatus] = useState(tokenParam ? 'loading' : 'no-token')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(searchParams.get('email') || '')

  useEffect(() => {
    if (!tokenParam) return

    verifyOTP('', tokenParam)
      .then(() => {
        setStatus('success')
        setMessage('Your account has been verified and activated! You can now log in.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Verification failed. The link may have expired.')
      })
  }, [tokenParam])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = async () => {
    if (!email) return setMessage('Please enter your email first.')
    try {
      await resendOTP(email)
      setMessage('A new verification email has been sent.')
    } catch (err) {
      setMessage(err.message || 'Failed to resend. Please try again.')
    }
  }

  return (
    <div className="login-page login-staff">
      <div className="card login-card">
        <div className="card-header"><div className="login-logo">StaffClock</div></div>
        <div className="card-body text-center py-5">

          {status === 'loading' && (
            <>
              <div className="spinner-border text-warning mb-3"></div>
              <h5>Verifying your account…</h5>
              <p className="text-muted small">This will only take a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <i className="fas fa-check-circle fa-4x text-success mb-3"></i>
              <h5 className="text-success">Account Activated!</h5>
              <p className="text-muted">{message}</p>
              <p className="text-muted small">
                Use the temporary password from your welcome email to sign in,
                then change it from your profile.
              </p>
              <button className="btn btn-warning w-100 mt-3" onClick={() => navigate('/')}>
                <i className="fas fa-sign-in-alt me-2"></i>Go to Login
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <i className="fas fa-times-circle fa-4x text-danger mb-3"></i>
              <h5 className="text-danger">Verification Failed</h5>
              <p className="text-muted">{message}</p>
              <p className="text-muted small">
                If the link has expired, enter your email below and request a new one.
              </p>
              <div className="mt-3">
                <input className="form-control mb-2" type="email" placeholder="Your email"
                  value={email} onChange={e => setEmail(e.target.value)} />
                <button className="btn btn-warning w-100" onClick={handleResend}>
                  <i className="fas fa-paper-plane me-2"></i>Resend Verification Email
                </button>
              </div>
              <Link to="/" className="d-block mt-3 text-decoration-none">
                <i className="fas fa-arrow-left me-2"></i>Back to Login
              </Link>
            </>
          )}

          {status === 'no-token' && (
            <>
              <i className="fas fa-envelope-open-text fa-4x text-warning mb-3"></i>
              <h5>Check Your Email</h5>
              <p className="text-muted">
                A verification link has been sent to your email address.
                Click the link to activate your account.
              </p>
              <p className="text-muted small">
                Didn't receive it? Enter your email below to resend.
              </p>
              <div className="mt-3">
                <input className="form-control mb-2" type="email" placeholder="Your email"
                  value={email} onChange={e => setEmail(e.target.value)} />
                <button className="btn btn-warning w-100" onClick={handleResend}>
                  <i className="fas fa-paper-plane me-2"></i>Resend Verification Email
                </button>
                {message && <small className="d-block mt-2 text-muted">{message}</small>}
              </div>
              <Link to="/" className="d-block mt-3 text-decoration-none">
                <i className="fas fa-arrow-left me-2"></i>Back to Login
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
